package com.resultpoint.modules.calculation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterSgpaInput {

    @NotNull(message = "Semester number is required")
    private Integer semesterNumber;

    @NotNull(message = "SGPA is required")
    @DecimalMin(value = "0.0", message = "SGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "SGPA cannot exceed 10.0")
    private BigDecimal sgpa;

    @NotNull(message = "Credits are required")
    @DecimalMin(value = "1.0", message = "Semester credits must be at least 1.0")
    @DecimalMax(value = "60.0", message = "Semester credits cannot exceed 60.0")
    private BigDecimal credits;
}
