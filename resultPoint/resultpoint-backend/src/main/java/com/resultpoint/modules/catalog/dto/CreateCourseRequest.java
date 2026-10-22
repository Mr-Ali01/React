package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.CourseLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseRequest {

    @NotBlank(message = "University ID is required")
    private String universityId;

    @NotBlank(message = "Course name is required")
    @Size(max = 200, message = "Course name cannot exceed 200 characters")
    private String name;

    @NotBlank(message = "Short name / acronym is required")
    @Size(max = 30, message = "Short name cannot exceed 30 characters")
    private String shortName;

    @NotNull(message = "Course level is required (UG, PG, DIPLOMA, PHD)")
    private CourseLevel level;

    @NotNull(message = "Duration in years is required")
    @Min(value = 1, message = "Duration must be at least 1 year")
    private Integer durationYears;

    @NotNull(message = "Total semesters is required")
    @Min(value = 1, message = "Total semesters must be at least 1")
    private Integer totalSemesters;

    @NotNull(message = "Total degree credits is required")
    @DecimalMin(value = "10.0", message = "Total degree credits must be at least 10.0")
    private BigDecimal totalDegreeCredits;
}
