package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.calculation.dto.CalculationRuleDto;
import com.resultpoint.modules.calculation.dto.GradingScaleDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegulationDetailDto {
    private RegulationDto regulation;
    private GradingScaleDto gradingScale;
    private CalculationRuleDto calculationRule;
    private List<AdmissionBatchDto> admissionBatches;
    private List<CurriculumSubjectDto> curriculumSubjects;
}
