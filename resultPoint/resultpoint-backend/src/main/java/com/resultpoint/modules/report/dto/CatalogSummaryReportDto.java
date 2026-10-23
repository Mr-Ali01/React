package com.resultpoint.modules.report.dto;

import java.util.List;

public record CatalogSummaryReportDto(
        Long totalUniversities,
        Long totalCourses,
        Long totalRegulations,
        Long totalSubjects,
        List<UniversityBreakdown> universities,
        List<RegulationBreakdown> regulations
) {
    public record UniversityBreakdown(
            String id,
            String code,
            String name,
            long courseCount
    ) {}

    public record RegulationBreakdown(
            String id,
            String code,
            String name,
            String universityName,
            String verificationStatus,
            boolean specialSuperGradeSupported
    ) {}
}
