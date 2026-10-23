package com.resultpoint.modules.student.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class SubjectResultInputDto {

    @NotBlank(message = "Subject code is required")
    private String subjectCode;

    @NotBlank(message = "Subject name is required")
    private String subjectName;

    @NotNull(message = "Credits are required")
    @DecimalMin(value = "0.5", message = "Subject credits must be at least 0.5")
    private BigDecimal credits;

    private String gradeLetter;

    private BigDecimal gradePoints;

    private BigDecimal internalMarks;

    private BigDecimal externalMarks;

    private BigDecimal maxMarks;
}
