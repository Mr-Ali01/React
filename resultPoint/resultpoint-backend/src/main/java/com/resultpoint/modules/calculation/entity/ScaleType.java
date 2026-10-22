package com.resultpoint.modules.calculation.entity;

public enum ScaleType {
    TEN_POINT_O("10_POINT_O"),
    TEN_POINT_S("10_POINT_S"),
    FOUR_POINT("4_POINT"),
    PERCENTAGE_ONLY("PERCENTAGE_ONLY");

    private final String dbValue;

    ScaleType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static ScaleType fromDbValue(String dbValue) {
        for (ScaleType type : values()) {
            if (type.dbValue.equalsIgnoreCase(dbValue)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown scale type: " + dbValue);
    }
}
