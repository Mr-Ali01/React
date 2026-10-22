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

    @NotNull(message = "Completed credits are required")
    @DecimalMin(value = "1.0", message = "Completed credits must be at least 1.0")
    private BigDecimal completedCredits;

    @NotNull(message = "Target CGPA is required")
    @DecimalMin(value = "0.0", message = "Target CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "Target CGPA cannot exceed 10.0")
    private BigDecimal targetCgpa;

    @NotNull(message = "Remaining credits are required")
    @DecimalMin(value = "1.0", message = "Remaining credits must be at least 1.0")
    private BigDecimal remainingCredits;
}
