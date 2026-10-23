package com.resultpoint.modules.student.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class CreateGoalRequest {

    @NotNull(message = "Target CGPA is required")
    @DecimalMin(value = "0.0", message = "Target CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "Target CGPA cannot exceed 10.0")
    private BigDecimal targetCgpa;

    @Min(value = 1, message = "Target semester must be at least 1")
    private int targetSemester;
}
