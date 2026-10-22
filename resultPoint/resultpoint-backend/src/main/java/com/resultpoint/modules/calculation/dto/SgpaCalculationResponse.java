package com.resultpoint.modules.calculation.dto;

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
public class SgpaCalculationResponse {
    private BigDecimal sgpa;
    private BigDecimal totalCredits;
    private BigDecimal totalCreditPoints;
    private int totalSubjects;
    private int passedSubjects;
    private int failedSubjects;
    @com.fasterxml.jackson.annotation.JsonProperty("isAllPassed")
    private boolean isAllPassed;
    private String academicStanding;
    private String formulaExplanation;
    private String gradingScaleName;
    private String verificationStatus;
    private List<SubjectGradeResult> subjectResults;
}
