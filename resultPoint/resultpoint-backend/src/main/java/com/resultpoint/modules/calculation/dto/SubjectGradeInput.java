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
public class SubjectGradeInput {

    private String subjectCode;

    private String subjectName;

    @NotNull(message = "Credits are required")
    @DecimalMin(value = "0.5", message = "Credits must be at least 0.5")
    @DecimalMax(value = "30.0", message = "Credits cannot exceed 30.0")
    private BigDecimal credits;

    /**
     * Optional raw marks obtained (e.g., 88.5). If provided, mapped against regulation grade boundaries.
     */
    @DecimalMin(value = "0.0", message = "Marks obtained cannot be negative")
    private BigDecimal marksObtained;

    /**
     * Optional maximum marks (default 100.0).
     */
    @DecimalMin(value = "1.0", message = "Max marks must be positive")
    private BigDecimal maxMarks;

    /**
     * Optional letter grade (e.g., "S", "A", "O", "B+").
     */
    private String letterGrade;

    /**
     * Optional direct grade points (e.g., 10.0, 9.0).
     */
    @DecimalMin(value = "0.0", message = "Grade points cannot be negative")
    @DecimalMax(value = "10.0", message = "Grade points cannot exceed 10.0")
    private BigDecimal gradePoints;
}
