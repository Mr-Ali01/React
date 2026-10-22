package com.resultpoint.modules.calculation.dto;

import com.resultpoint.modules.calculation.entity.RuleRoundingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculationRuleDto {
    private String id;
    private String name;
    private String sgpaFormula;
    private String cgpaFormula;
    private String percentageFormulaExpression;
    private String percentageFormulaDesc;
    private RuleRoundingMode roundingMode;
    private int decimalPlaces;
}
