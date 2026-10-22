package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.RegulationStatus;
import com.resultpoint.modules.catalog.entity.RegulationVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegulationDto {
    private String id;
    private String courseId;
    private String courseName;
    private String universityId;
    private String universityName;
    private String code;
    private String name;
    private String ruleVersion;
    private RegulationVerificationStatus verificationStatus;
    private String gradingScaleId;
    private String gradingScaleName;
    private String calculationRuleId;
    private String calculationRuleName;
    private RegulationStatus status;
}
