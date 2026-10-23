package com.resultpoint.modules.dataimport.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
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
public class ImportSubjectsRequest {

    @NotBlank(message = "Regulation ID is required")
    private String regulationId;

    @Min(value = 1, message = "Semester number must be at least 1")
    @Max(value = 12, message = "Semester number cannot exceed 12")
    private int semesterNumber;

    @NotEmpty(message = "At least one subject must be provided for import")
    @Valid
    private List<SubjectImportItem> subjects;
}
