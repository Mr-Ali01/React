package com.resultpoint.modules.calculation.entity;

import java.math.RoundingMode;

public enum RuleRoundingMode {
    HALF_UP(RoundingMode.HALF_UP),
    FLOOR(RoundingMode.FLOOR),
    CEILING(RoundingMode.CEILING),
    TRUNCATE(RoundingMode.DOWN);

    private final RoundingMode mathRoundingMode;

    RuleRoundingMode(RoundingMode mathRoundingMode) {
        this.mathRoundingMode = mathRoundingMode;
    }

    public RoundingMode toMathRoundingMode() {
        return mathRoundingMode;
    }
}
