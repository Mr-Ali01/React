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
public class TargetCgpaRequest {

    @NotNull(message = "Current CGPA is required")
    @DecimalMin(value = "0.0", message = "Current CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "Current CGPA cannot exceed 10.0")
    private BigDecimal currentCgpa;

    @NotNull(message = "Target CGPA is required")
    @DecimalMin(value = "0.0", message = "Target CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "Target CGPA cannot exceed 10.0")
    private BigDecimal targetCgpa;

    // Credit-weighted inputs
    @DecimalMin(value = "0.0", message = "Completed credits cannot be negative")
    private BigDecimal completedCredits;

    @DecimalMin(value = "0.0", message = "Remaining credits cannot be negative")
    private BigDecimal remainingCredits;

    // Semester-based inputs (per api-specification.md)
    @jakarta.validation.constraints.Min(value = 0, message = "Completed semesters cannot be negative")
    private Integer completedSemesters;

    @jakarta.validation.constraints.Min(value = 1, message = "Total semesters must be at least 1")
    private Integer totalSemesters;

    @jakarta.validation.constraints.Min(value = 0, message = "Remaining semesters cannot be negative")
    private Integer remainingSemesters;
}
