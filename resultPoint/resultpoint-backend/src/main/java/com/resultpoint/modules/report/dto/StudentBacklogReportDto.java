package com.resultpoint.modules.report.dto;

import java.util.List;

public record StudentBacklogReportDto(
        String studentId,
        String hallTicketNumber,
        String fullName,
        Integer totalBacklogsRecorded,
        Integer activeBacklogsCount,
        Integer clearedBacklogsCount,
        Integer creditsAtRisk,
        List<BacklogDetailEntry> backlogs
) {
    public record BacklogDetailEntry(
            String backlogId,
            String subjectCode,
            String subjectName,
            Integer semesterNumber,
            Integer credits,
            Boolean isCleared,
            String clearedInPeriod,
            String clearedGrade
    ) {}
}
