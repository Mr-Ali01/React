package com.resultpoint.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUniversityRequest {

    @NotBlank(message = "University name is required")
    @Size(max = 200, message = "University name cannot exceed 200 characters")
    private String name;

    @NotBlank(message = "Short name / acronym is required")
    @Size(max = 30, message = "Short name cannot exceed 30 characters")
    private String shortName;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @NotBlank(message = "Type is required (e.g. State Public University)")
    @Size(max = 60, message = "Type cannot exceed 60 characters")
    private String type;

    private String website;

    private String accreditation;

    private Integer establishedYear;
}
