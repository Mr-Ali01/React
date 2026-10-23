package com.resultpoint.modules.student.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveSemesterResultRequest {

    @Min(value = 1, message = "Semester number must be at least 1")
    private int semesterNumber;

    @NotBlank(message = "Academic period is required (e.g. 'Fall 2024', 'Semester 1')")
    private String academicPeriod;

    @NotEmpty(message = "Subjects list cannot be empty")
    @Valid
    private List<SubjectResultInputDto> subjects;
}
