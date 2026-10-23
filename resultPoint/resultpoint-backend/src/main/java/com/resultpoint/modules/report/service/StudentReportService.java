package com.resultpoint.modules.report.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.modules.calculation.dto.PercentageCalculationRequest;
import com.resultpoint.modules.calculation.dto.PercentageCalculationResponse;
import com.resultpoint.modules.calculation.dto.TargetCgpaRequest;
import com.resultpoint.modules.calculation.dto.TargetCgpaResponse;
import com.resultpoint.modules.calculation.engine.AcademicCalculationEngine;
import com.resultpoint.modules.calculation.service.CalculationService;
import com.resultpoint.modules.report.dto.StudentBacklogReportDto;
import com.resultpoint.modules.report.dto.StudentPerformanceReportDto;
import com.resultpoint.modules.report.dto.StudentProjectionReportDto;
import com.resultpoint.modules.student.domain.BacklogStatus;
import com.resultpoint.modules.student.domain.SemesterResult;
import com.resultpoint.modules.student.domain.StudentBacklog;
import com.resultpoint.modules.student.domain.StudentGoal;
import com.resultpoint.modules.student.domain.StudentProfile;
import com.resultpoint.modules.student.domain.SubjectResult;
import com.resultpoint.modules.student.repository.SemesterResultRepository;
import com.resultpoint.modules.student.repository.StudentBacklogRepository;
import com.resultpoint.modules.student.repository.StudentGoalRepository;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import com.resultpoint.modules.student.repository.SubjectResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class StudentReportService {

    private final StudentProfileRepository profileRepository;
    private final SemesterResultRepository resultRepository;
    private final SubjectResultRepository subjectResultRepository;
    private final StudentBacklogRepository backlogRepository;
    private final StudentGoalRepository goalRepository;
    private final CalculationService calculationService;
    private final AcademicCalculationEngine calculationEngine;

    public StudentPerformanceReportDto getPerformanceReport(String userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<SemesterResult> results = resultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());

        int totalAttempted = 0;
        int totalEarned = 0;
        int totalPassed = 0;
        int totalFailed = 0;
        BigDecimal latestCgpa = BigDecimal.ZERO;

        List<StudentPerformanceReportDto.SemesterTrendEntry> trends = new ArrayList<>();

        for (SemesterResult r : results) {
            List<SubjectResult> subjects = subjectResultRepository.findBySemesterResultId(r.getId());
            int passCount = 0;
            int failCount = 0;
            for (SubjectResult s : subjects) {
                if (s.isPass()) {
                    passCount++;
                } else {
                    failCount++;
                }
            }

            int semAttempted = r.getTotalCredits() != null ? r.getTotalCredits().intValue() : 0;
            int semEarned = r.getCreditsEarned() != null ? r.getCreditsEarned().intValue() : 0;

            totalAttempted += semAttempted;
            totalEarned += semEarned;
            totalPassed += passCount;
            totalFailed += failCount;
            latestCgpa = r.getCgpa();

            trends.add(new StudentPerformanceReportDto.SemesterTrendEntry(
                    r.getSemesterNumber(),
                    r.getSgpa(),
                    r.getCgpa(),
                    semAttempted,
                    semEarned,
                    passCount,
                    failCount,
                    r.getStandingStatus()
            ));
        }

        BigDecimal percentage = BigDecimal.ZERO;
        String percentageVerificationStatus = "UNVERIFIED";

        if (latestCgpa.compareTo(BigDecimal.ZERO) > 0) {
            try {
                PercentageCalculationResponse pctRes = calculationService.calculatePercentage(
                        PercentageCalculationRequest.builder()
                                .cgpa(latestCgpa)
                                .regulationId(profile.getRegulation() != null ? profile.getRegulation().getId() : null)
                                .build()
                );
                percentage = pctRes.getPercentage();
                percentageVerificationStatus = pctRes.getVerificationStatus();
            } catch (Exception e) {
                log.warn("Failed to calculate percentage for report: {}", e.getMessage());
                percentage = latestCgpa.multiply(new BigDecimal("10.00")).setScale(2, RoundingMode.HALF_UP);
                percentageVerificationStatus = "UNVERIFIED";
            }
        }

        String fullName = (profile.getUser() != null && profile.getUser().getFullName() != null)
                ? profile.getUser().getFullName()
                : "Student";

        return new StudentPerformanceReportDto(
                profile.getId(),
                profile.getHallTicketNumber(),
                fullName,
                profile.getCourse() != null ? profile.getCourse().getName() : "N/A",
                profile.getRegulation() != null ? profile.getRegulation().getCode() : "N/A",
                latestCgpa,
                percentage,
                percentageVerificationStatus,
                totalAttempted,
                totalEarned,
                totalPassed,
                totalFailed,
                trends
        );
    }

    public StudentBacklogReportDto getBacklogReport(String userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<StudentBacklog> backlogs = backlogRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());

        int activeCount = 0;
        int clearedCount = 0;
        int creditsAtRisk = 0;

        List<StudentBacklogReportDto.BacklogDetailEntry> details = new ArrayList<>();

        for (StudentBacklog b : backlogs) {
            boolean cleared = (b.getStatus() == BacklogStatus.CLEARED);
            if (cleared) {
                clearedCount++;
            } else {
                activeCount++;
                creditsAtRisk += (b.getCredits() != null ? b.getCredits().intValue() : 0);
            }

            details.add(new StudentBacklogReportDto.BacklogDetailEntry(
                    b.getId(),
                    b.getSubjectCode(),
                    b.getSubjectName(),
                    b.getSemesterNumber(),
                    b.getCredits() != null ? b.getCredits().intValue() : 0,
                    cleared,
                    b.getClearedInPeriod(),
                    b.getClearedGrade()
            ));
        }

        String fullName = (profile.getUser() != null && profile.getUser().getFullName() != null)
                ? profile.getUser().getFullName()
                : "Student";

        return new StudentBacklogReportDto(
                profile.getId(),
                profile.getHallTicketNumber(),
                fullName,
                backlogs.size(),
                activeCount,
                clearedCount,
                creditsAtRisk,
                details
        );
    }

    public StudentProjectionReportDto getProjectionReport(String userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<SemesterResult> results = resultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());
        List<StudentGoal> goals = goalRepository.findByStudentProfileIdOrderByCreatedAtDesc(profile.getId());

        int currentSemester = profile.getCurrentSemester();
        int totalSemesters = (profile.getCourse() != null) ? profile.getCourse().getTotalSemesters() : 6;

        int completedSemesters = results.size();
        int remainingSemesters = Math.max(0, totalSemesters - completedSemesters);

        BigDecimal currentCgpa = BigDecimal.ZERO;
        int totalEarnedCredits = 0;

        if (!results.isEmpty()) {
            SemesterResult latest = results.get(results.size() - 1);
            currentCgpa = latest.getCgpa();
            for (SemesterResult r : results) {
                totalEarnedCredits += (r.getCreditsEarned() != null ? r.getCreditsEarned().intValue() : 0);
            }
        }

        List<StudentProjectionReportDto.GoalProjectionEntry> projections = new ArrayList<>();

        for (StudentGoal goal : goals) {
            int targetSem = goal.getTargetSemester();
            int semsLeftForGoal = Math.max(1, targetSem - completedSemesters);

            TargetCgpaRequest req = TargetCgpaRequest.builder()
                    .currentCgpa(currentCgpa)
                    .targetCgpa(goal.getTargetCgpa())
                    .completedSemesters(completedSemesters)
                    .totalSemesters(targetSem)
                    .remainingSemesters(semsLeftForGoal)
                    .build();

            try {
                TargetCgpaResponse resp = calculationEngine.calculateTargetCgpa(req);
                projections.add(new StudentProjectionReportDto.GoalProjectionEntry(
                        goal.getId(),
                        goal.getTargetCgpa(),
                        targetSem,
                        resp.getRequiredSgpa(),
                        resp.isAchievable(),
                        resp.getStatusMessage() != null ? resp.getStatusMessage() : resp.getRecommendation()
                ));
            } catch (Exception e) {
                log.warn("Failed calculating target projection for goal {}: {}", goal.getId(), e.getMessage());
                projections.add(new StudentProjectionReportDto.GoalProjectionEntry(
                        goal.getId(),
                        goal.getTargetCgpa(),
                        targetSem,
                        null,
                        false,
                        "Calculation error: " + e.getMessage()
                ));
            }
        }

        String fullName = (profile.getUser() != null && profile.getUser().getFullName() != null)
                ? profile.getUser().getFullName()
                : "Student";

        return new StudentProjectionReportDto(
                profile.getId(),
                fullName,
                currentCgpa,
                totalEarnedCredits,
                currentSemester,
                remainingSemesters,
                projections
        );
    }
}
