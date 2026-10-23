package com.resultpoint.modules.dataimport.dto;

import com.resultpoint.modules.catalog.entity.RegulationVerificationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegulationImportItem {

    @NotBlank(message = "Regulation code is required")
    private String code;

    @NotBlank(message = "Regulation name is required")
    private String name;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotBlank(message = "Grading scale ID is required")
    private String gradingScaleId;

    @NotBlank(message = "Calculation rule ID is required")
    private String calculationRuleId;

    @Builder.Default
    private String ruleVersion = "1.0";

    @Builder.Default
    private RegulationVerificationStatus verificationStatus = RegulationVerificationStatus.UNDER_REVIEW;
}
