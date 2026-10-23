package com.resultpoint.modules.student.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.calculation.dto.TargetCgpaRequest;
import com.resultpoint.modules.calculation.dto.TargetCgpaResponse;
import com.resultpoint.modules.calculation.engine.AcademicCalculationEngine;
import com.resultpoint.modules.student.domain.FeasibilityStatus;
import com.resultpoint.modules.student.domain.StudentGoal;
import com.resultpoint.modules.student.domain.StudentProfile;
import com.resultpoint.modules.student.dto.CreateGoalRequest;
import com.resultpoint.modules.student.dto.StudentGoalDto;
import com.resultpoint.modules.student.dto.UpdateGoalRequest;
import com.resultpoint.modules.student.repository.StudentGoalRepository;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentGoalService {

    private final StudentGoalRepository studentGoalRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final com.resultpoint.modules.student.repository.SemesterResultRepository semesterResultRepository;
    private final AcademicCalculationEngine calculationEngine;

    @Transactional(readOnly = true)
    public List<StudentGoalDto> getGoals(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        return studentGoalRepository.findByStudentProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentGoalDto createGoal(String userId, CreateGoalRequest request) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Student profile must be created before setting academic goals."));

        if (request.getTargetCgpa().compareTo(BigDecimal.TEN) > 0) {
            throw new IllegalArgumentException("Target CGPA cannot exceed maximum grading scale point of 10.00");
        }

        if (request.getTargetSemester() > profile.getCourse().getTotalSemesters()) {
            throw new IllegalArgumentException(String.format("Target semester (%d) exceeds course total semesters (%d)",
                    request.getTargetSemester(), profile.getCourse().getTotalSemesters()));
        }

        int completedSemesters = semesterResultRepository.countByStudentProfileId(profile.getId());
        if (completedSemesters >= request.getTargetSemester()) {
            completedSemesters = Math.max(0, request.getTargetSemester() - 1);
        }

        TargetCgpaRequest calcReq = TargetCgpaRequest.builder()
                .currentCgpa(profile.getCumulativeCgpa())
                .completedSemesters(completedSemesters)
                .totalSemesters(request.getTargetSemester())
                .targetCgpa(request.getTargetCgpa())
                .build();

        TargetCgpaResponse calcResp = calculationEngine.calculateTargetCgpa(calcReq);

        FeasibilityStatus feasibility;
        if (!calcResp.isAchievable()) {
            feasibility = FeasibilityStatus.MATHEMATICALLY_IMPOSSIBLE;
        } else if ("CHALLENGING".equalsIgnoreCase(calcResp.getFeasibility()) || "VERY_CHALLENGING".equalsIgnoreCase(calcResp.getFeasibility())) {
            feasibility = FeasibilityStatus.CHALLENGING;
        } else {
            feasibility = FeasibilityStatus.ACHIEVABLE;
        }

        StudentGoal goal = StudentGoal.builder()
                .id(IdGenerator.generateGoalId())
                .studentProfile(profile)
                .targetCgpa(request.getTargetCgpa())
                .targetSemester(request.getTargetSemester())
                .requiredSgpa(calcResp.getRequiredSgpa() != null ? calcResp.getRequiredSgpa() : BigDecimal.ZERO)
                .feasibilityStatus(feasibility)
                .active(true)
                .build();

        StudentGoal saved = studentGoalRepository.save(goal);
        log.info("Created academic goal {} for student profile {} (Target: {}, Req SGPA: {})",
                saved.getId(), profile.getId(), saved.getTargetCgpa(), saved.getRequiredSgpa());
        return mapToDto(saved);
    }

    @Transactional
    public StudentGoalDto updateGoal(String userId, String goalId, UpdateGoalRequest request) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        StudentGoal goal = studentGoalRepository.findByIdAndStudentProfileId(goalId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("StudentGoal", "id", goalId));

        boolean needsRecalculation = false;
        if (request.getTargetCgpa() != null) {
            goal.setTargetCgpa(request.getTargetCgpa());
            needsRecalculation = true;
        }
        if (request.getTargetSemester() != null) {
            if (request.getTargetSemester() > profile.getCourse().getTotalSemesters()) {
                throw new IllegalArgumentException(String.format("Target semester (%d) exceeds course total semesters (%d)",
                        request.getTargetSemester(), profile.getCourse().getTotalSemesters()));
            }
            goal.setTargetSemester(request.getTargetSemester());
            needsRecalculation = true;
        }
        if (request.getIsActive() != null) {
            goal.setActive(request.getIsActive());
        }

        if (needsRecalculation) {
            int completedSemesters = Math.max(0, profile.getCurrentSemester() - 1);
            if (completedSemesters >= goal.getTargetSemester()) {
                completedSemesters = Math.max(0, goal.getTargetSemester() - 1);
            }

            TargetCgpaRequest calcReq = TargetCgpaRequest.builder()
                    .currentCgpa(profile.getCumulativeCgpa())
                    .completedSemesters(completedSemesters)
                    .totalSemesters(goal.getTargetSemester())
                    .targetCgpa(goal.getTargetCgpa())
                    .build();

            TargetCgpaResponse calcResp = calculationEngine.calculateTargetCgpa(calcReq);

            FeasibilityStatus feasibility;
            if (!calcResp.isAchievable()) {
                feasibility = FeasibilityStatus.MATHEMATICALLY_IMPOSSIBLE;
            } else if ("CHALLENGING".equalsIgnoreCase(calcResp.getFeasibility()) || "VERY_CHALLENGING".equalsIgnoreCase(calcResp.getFeasibility())) {
                feasibility = FeasibilityStatus.CHALLENGING;
            } else {
                feasibility = FeasibilityStatus.ACHIEVABLE;
            }

            goal.setRequiredSgpa(calcResp.getRequiredSgpa() != null ? calcResp.getRequiredSgpa() : BigDecimal.ZERO);
            goal.setFeasibilityStatus(feasibility);
        }

        StudentGoal saved = studentGoalRepository.save(goal);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteGoal(String userId, String goalId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        StudentGoal goal = studentGoalRepository.findByIdAndStudentProfileId(goalId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("StudentGoal", "id", goalId));

        studentGoalRepository.delete(goal);
        log.info("Deleted goal {} for student profile {}", goalId, profile.getId());
    }

    public StudentGoalDto mapToDto(StudentGoal g) {
        return StudentGoalDto.builder()
                .id(g.getId())
                .studentProfileId(g.getStudentProfile().getId())
                .targetCgpa(g.getTargetCgpa())
                .targetSemester(g.getTargetSemester())
                .requiredSgpa(g.getRequiredSgpa())
                .feasibilityStatus(g.getFeasibilityStatus())
                .active(g.isActive())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}
