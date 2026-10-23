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
public class TargetCgpaResponse {
    private BigDecimal currentCgpa;
    private BigDecimal targetCgpa;
    private BigDecimal requiredSgpa;
    @com.fasterxml.jackson.annotation.JsonProperty("isAchievable")
    private boolean isAchievable;
    private String feasibility;
    private Integer remainingSemesters;
    private BigDecimal remainingCredits;
    private BigDecimal maxPossibleCgpa;
    private String statusMessage;
    private String recommendation;
    private String formulaExplanation;
}
