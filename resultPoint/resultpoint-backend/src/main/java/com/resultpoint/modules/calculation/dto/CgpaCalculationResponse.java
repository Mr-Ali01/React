package com.resultpoint.modules.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CgpaCalculationResponse {
    private BigDecimal cgpa;
    private BigDecimal totalCredits;
    private BigDecimal totalCreditPoints;
    private int totalSemesters;
    private BigDecimal equivalentPercentage;
    private String classification;
    private String formulaExplanation;
    private String percentageFormulaExplanation;
    private String verificationStatus;
}
