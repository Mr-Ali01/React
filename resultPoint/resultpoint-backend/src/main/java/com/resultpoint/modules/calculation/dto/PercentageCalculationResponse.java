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
public class PercentageCalculationResponse {
    private BigDecimal cgpa;
    private BigDecimal percentage;
    private String formulaExpression;
    private String formulaExplanation;
    private String universityName;
    private String notes;
}
