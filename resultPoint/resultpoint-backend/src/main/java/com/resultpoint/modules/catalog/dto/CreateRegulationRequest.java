package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.RegulationVerificationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRegulationRequest {

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotBlank(message = "Regulation code is required")
    @Size(max = 30, message = "Regulation code cannot exceed 30 characters")
    private String code;

    @NotBlank(message = "Regulation name is required")
    @Size(max = 150, message = "Regulation name cannot exceed 150 characters")
    private String name;

    @NotBlank(message = "Rule version is required (e.g. 2024.1)")
    @Size(max = 50, message = "Rule version cannot exceed 50 characters")
    private String ruleVersion;

    private RegulationVerificationStatus verificationStatus;

    @NotBlank(message = "Grading scale ID is required")
    private String gradingScaleId;

    @NotBlank(message = "Calculation rule ID is required")
    private String calculationRuleId;

    private List<String> batchYears;
}
