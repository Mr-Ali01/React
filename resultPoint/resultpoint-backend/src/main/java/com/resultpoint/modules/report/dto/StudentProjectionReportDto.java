package com.resultpoint.modules.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record StudentProjectionReportDto(
        String studentId,
        String fullName,
        BigDecimal currentCgpa,
        Integer totalCreditsEarned,
        Integer currentSemester,
        Integer remainingSemesters,
        List<GoalProjectionEntry> goalProjections
) {
    public record GoalProjectionEntry(
            String goalId,
            BigDecimal targetCgpa,
            Integer targetSemester,
            BigDecimal requiredAverageSgpa,
            Boolean isFeasible,
            String analysisMessage
    ) {}
}
