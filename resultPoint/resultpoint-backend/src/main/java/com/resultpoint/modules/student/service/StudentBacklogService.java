package com.resultpoint.modules.student.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.student.domain.BacklogStatus;
import com.resultpoint.modules.student.domain.StudentBacklog;
import com.resultpoint.modules.student.domain.StudentProfile;
import com.resultpoint.modules.student.domain.SubjectResult;
import com.resultpoint.modules.student.dto.ClearBacklogRequest;
import com.resultpoint.modules.student.dto.StudentBacklogDto;
import com.resultpoint.modules.student.repository.StudentBacklogRepository;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentBacklogService {

    private final StudentBacklogRepository studentBacklogRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Transactional(readOnly = true)
    public List<StudentBacklogDto> getBacklogs(String userId, BacklogStatus status) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<StudentBacklog> backlogs;
        if (status != null) {
            backlogs = studentBacklogRepository.findByStudentProfileIdAndStatusOrderBySemesterNumberAsc(profile.getId(), status);
        } else {
            backlogs = studentBacklogRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());
        }

        return backlogs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public StudentBacklogDto clearBacklog(String userId, ClearBacklogRequest request) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        StudentBacklog backlog = studentBacklogRepository.findById(request.getBacklogId())
                .orElseThrow(() -> new ResourceNotFoundException("StudentBacklog", "id", request.getBacklogId()));

        if (!backlog.getStudentProfile().getId().equals(profile.getId())) {
            throw new IllegalArgumentException("Cannot clear backlog belonging to another student");
        }

        backlog.setStatus(BacklogStatus.CLEARED);
        backlog.setClearedInPeriod(request.getClearedInPeriod());
        backlog.setClearedGrade(request.getClearedGrade());
        backlog.setClearedAt(Instant.now());

        StudentBacklog saved = studentBacklogRepository.save(backlog);
        log.info("Backlog {} cleared for student profile {}", saved.getId(), profile.getId());
        return mapToDto(saved);
    }

    @Transactional
    public void syncBacklogsForResult(StudentProfile profile, int semesterNumber, List<SubjectResult> subjects, String academicPeriod) {
        for (SubjectResult sub : subjects) {
            if (!sub.isPass()) {
                // Check if active backlog already exists
                Optional<StudentBacklog> existing = studentBacklogRepository
                        .findByStudentProfileIdAndSubjectCodeAndStatus(profile.getId(), sub.getSubjectCode(), BacklogStatus.ACTIVE);

                if (existing.isEmpty()) {
                    StudentBacklog backlog = StudentBacklog.builder()
                            .id(IdGenerator.generateBacklogId())
                            .studentProfile(profile)
                            .subjectCode(sub.getSubjectCode())
                            .subjectName(sub.getSubjectName())
                            .semesterNumber(semesterNumber)
                            .credits(sub.getCredits())
                            .status(BacklogStatus.ACTIVE)
                            .build();
                    studentBacklogRepository.save(backlog);
                    log.info("Active backlog recorded: {} (Sem {}) for student {}", sub.getSubjectCode(), semesterNumber, profile.getId());
                }
            } else {
                // If subject is passed, check if there was an active backlog for it from a previous semester/attempt
                Optional<StudentBacklog> activeBacklog = studentBacklogRepository
                        .findByStudentProfileIdAndSubjectCodeAndStatus(profile.getId(), sub.getSubjectCode(), BacklogStatus.ACTIVE);

                activeBacklog.ifPresent(b -> {
                    b.setStatus(BacklogStatus.CLEARED);
                    b.setClearedInPeriod(academicPeriod);
                    b.setClearedGrade(sub.getGradeLetter());
                    b.setClearedAt(Instant.now());
                    studentBacklogRepository.save(b);
                    log.info("Backlog cleared via passing result: {} in period {}", b.getSubjectCode(), academicPeriod);
                });
            }
        }
    }

    public StudentBacklogDto mapToDto(StudentBacklog b) {
        return StudentBacklogDto.builder()
                .id(b.getId())
                .studentProfileId(b.getStudentProfile().getId())
                .subjectCode(b.getSubjectCode())
                .subjectName(b.getSubjectName())
                .semesterNumber(b.getSemesterNumber())
                .credits(b.getCredits())
                .status(b.getStatus())
                .clearedInPeriod(b.getClearedInPeriod())
                .clearedGrade(b.getClearedGrade())
                .clearedAt(b.getClearedAt())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
