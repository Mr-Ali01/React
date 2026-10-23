package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentProfileRequest {

    @NotBlank(message = "University ID is required")
    private String universityId;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotBlank(message = "Regulation ID is required")
    private String regulationId;

    @NotBlank(message = "Batch year is required")
    private String batchYear;

    @NotBlank(message = "Hall ticket number is required")
    private String hallTicketNumber;

    private String institutionName;

    @Min(value = 1, message = "Current semester must be at least 1")
    @Max(value = 12, message = "Current semester cannot exceed 12")
    private int currentSemester;

    private LocalDate dateOfBirth;

    private Gender gender;

    @DecimalMin(value = "0.0", message = "Target CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "Target CGPA cannot exceed 10.0")
    private BigDecimal targetCgpa;
}
