package com.resultpoint.modules.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicHistoryDto {

    private AcademicSummary summary;
    private List<SemesterResultDto> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicSummary {
        private int totalSemestersRecorded;
        private BigDecimal cumulativeCgpa;
        private BigDecimal totalCreditsEarned;
        private int activeBacklogsCount;
        private int clearedBacklogsCount;
        private String currentAcademicStanding;
    }
}
