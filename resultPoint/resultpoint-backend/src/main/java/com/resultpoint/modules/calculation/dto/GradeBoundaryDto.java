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
public class GradeBoundaryDto {
    private Long id;
    private String gradeLetter;
    private BigDecimal gradePoints;
    private BigDecimal minPercentage;
    private BigDecimal maxPercentage;
    private String qualitativeDesc;
    private boolean isPass;
}
