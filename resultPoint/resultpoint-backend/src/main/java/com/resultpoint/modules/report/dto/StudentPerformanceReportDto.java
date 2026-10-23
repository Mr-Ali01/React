package com.resultpoint.modules.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record StudentPerformanceReportDto(
        String studentId,
        String hallTicketNumber,
        String fullName,
        String courseName,
        String regulationCode,
        BigDecimal cumulativeCgpa,
        BigDecimal estimatedPercentage,
        String percentageVerificationStatus,
        Integer totalCreditsAttempted,
        Integer totalCreditsEarned,
        Integer totalPassedSubjects,
        Integer totalFailedSubjects,
        List<SemesterTrendEntry> semesterTrends
) {
    public record SemesterTrendEntry(
            Integer semesterNumber,
            BigDecimal sgpa,
            BigDecimal cumulativeCgpa,
            Integer creditsAttempted,
            Integer creditsEarned,
            Integer subjectsPassed,
            Integer subjectsFailed,
            String resultStatus
    ) {}
}
