package com.resultpoint.modules.calculation.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.modules.calculation.dto.*;
import com.resultpoint.modules.calculation.engine.AcademicCalculationEngine;
import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradeBoundary;
import com.resultpoint.modules.calculation.entity.GradingScale;
import com.resultpoint.modules.calculation.formula.FormulaEvaluator;
import com.resultpoint.modules.calculation.repository.CalculationRuleRepository;
import com.resultpoint.modules.calculation.repository.GradingScaleRepository;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.catalog.repository.RegulationRepository;
import com.resultpoint.modules.catalog.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalculationService {

    private final AcademicCalculationEngine calculationEngine;
    private final FormulaEvaluator formulaEvaluator;
    private final GradingScaleRepository gradingScaleRepository;
    private final CalculationRuleRepository calculationRuleRepository;
    private final RegulationRepository regulationRepository;
    private final UniversityRepository universityRepository;

    /**
     * Calculates SGPA based on subject credits, grades, and optional university/regulation context.
     */
    public SgpaCalculationResponse calculateSgpa(SgpaCalculationRequest request) {
        GradingScale gradingScale = null;
        CalculationRule calculationRule = null;
        String verificationStatus = null;

        if (request.getRegulationId() != null && !request.getRegulationId().isBlank()) {
            Regulation regulation = regulationRepository.findById(request.getRegulationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", request.getRegulationId()));
            gradingScale = regulation.getGradingScale();
            calculationRule = regulation.getCalculationRule();
            verificationStatus = regulation.getVerificationStatus().name();
        } else if (request.getUniversityId() != null && !request.getUniversityId().isBlank()) {
            // Verify university exists
            if (!universityRepository.existsById(request.getUniversityId())) {
                throw new ResourceNotFoundException("University", "id", request.getUniversityId());
            }
        }

        return calculationEngine.calculateSgpa(request.getSubjects(), gradingScale, calculationRule, verificationStatus);
    }

    /**
     * Calculates CGPA from multi-semester SGPA inputs.
     */
    public CgpaCalculationResponse calculateCgpa(CgpaCalculationRequest request) {
        CalculationRule calculationRule = null;
        String verificationStatus = null;

        if (request.getRegulationId() != null && !request.getRegulationId().isBlank()) {
            Regulation regulation = regulationRepository.findById(request.getRegulationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", request.getRegulationId()));
            calculationRule = regulation.getCalculationRule();
            verificationStatus = regulation.getVerificationStatus().name();
        } else if (request.getUniversityId() != null && !request.getUniversityId().isBlank()) {
            if (!universityRepository.existsById(request.getUniversityId())) {
                throw new ResourceNotFoundException("University", "id", request.getUniversityId());
            }
        }

        return calculationEngine.calculateCgpa(request.getSemesters(), calculationRule, verificationStatus);
    }

    /**
     * Evaluates equivalent percentage from CGPA using institutional calculation rules.
     */
    public PercentageCalculationResponse calculatePercentage(PercentageCalculationRequest request) {
        CalculationRule rule;
        String universityName = null;

        if (request.getRuleCode() != null && !request.getRuleCode().isBlank()) {
            rule = calculationRuleRepository.findById(request.getRuleCode())
                    .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", request.getRuleCode()));
        } else if (request.getRegulationId() != null && !request.getRegulationId().isBlank()) {
            Regulation regulation = regulationRepository.findById(request.getRegulationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", request.getRegulationId()));
            rule = regulation.getCalculationRule();
            if (regulation.getCourse() != null && regulation.getCourse().getUniversity() != null) {
                universityName = regulation.getCourse().getUniversity().getName();
            }
        } else if (request.getUniversityId() != null && !request.getUniversityId().isBlank()) {
            var uni = universityRepository.findById(request.getUniversityId())
                    .orElseThrow(() -> new ResourceNotFoundException("University", "id", request.getUniversityId()));
            universityName = uni.getName();
            // Map default university rule
            if ("uni_ou".equalsIgnoreCase(uni.getId())) {
                rule = calculationRuleRepository.findById("rule_ou_cbcs_standard")
                        .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", "rule_ou_cbcs_standard"));
            } else if ("uni_jntuh".equalsIgnoreCase(uni.getId())) {
                rule = calculationRuleRepository.findById("rule_jntuh_r18")
                        .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", "rule_jntuh_r18"));
            } else {
                rule = calculationRuleRepository.findById("rule_standard_ugc")
                        .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", "rule_standard_ugc"));
            }
        } else {
            // Default to standard UGC rule
            rule = calculationRuleRepository.findById("rule_standard_ugc")
                    .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", "rule_standard_ugc"));
        }

        BigDecimal percentage = formulaEvaluator.evaluateCgpaFormula(
                rule.getPercentageFormulaExpression(),
                request.getCgpa(),
                rule.getDecimalPlaces(),
                rule.getRoundingMode() != null ? rule.getRoundingMode().toMathRoundingMode() : java.math.RoundingMode.HALF_UP
        );

        String formulaExplanation = String.format("%s = %s",
                rule.getPercentageFormulaDesc(),
                rule.getPercentageFormulaExpression().replace("CGPA", request.getCgpa().toPlainString()));

        return PercentageCalculationResponse.builder()
                .cgpa(request.getCgpa())
                .percentage(percentage)
                .formulaExpression(rule.getPercentageFormulaExpression())
                .formulaExplanation(formulaExplanation)
                .universityName(universityName)
                .notes(rule.getName())
                .build();
    }

    /**
     * Forecasts required future SGPA for target CGPA.
     */
    public TargetCgpaResponse calculateTargetCgpa(TargetCgpaRequest request) {
        return calculationEngine.calculateTargetCgpa(request);
    }

    /**
     * Retrieves all available grading scales.
     */
    public List<GradingScaleDto> getAllGradingScales() {
        return gradingScaleRepository.findAll().stream()
                .map(this::mapToGradingScaleDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves grading scale by ID.
     */
    public GradingScaleDto getGradingScaleById(String scaleId) {
        GradingScale scale = gradingScaleRepository.findById(scaleId)
                .orElseThrow(() -> new ResourceNotFoundException("GradingScale", "id", scaleId));
        return mapToGradingScaleDto(scale);
    }

    /**
     * Retrieves all calculation rules.
     */
    public List<CalculationRuleDto> getAllCalculationRules() {
        return calculationRuleRepository.findAll().stream()
                .map(this::mapToCalculationRuleDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves calculation rule by ID.
     */
    public CalculationRuleDto getCalculationRuleById(String ruleId) {
        CalculationRule rule = calculationRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", ruleId));
        return mapToCalculationRuleDto(rule);
    }

    private GradingScaleDto mapToGradingScaleDto(GradingScale scale) {
        List<GradeBoundaryDto> boundaryDtos = scale.getBoundaries().stream()
                .map(b -> GradeBoundaryDto.builder()
                        .id(b.getId())
                        .gradeLetter(b.getGradeLetter())
                        .gradePoints(b.getGradePoints())
                        .minPercentage(b.getMinPercentage())
                        .maxPercentage(b.getMaxPercentage())
                        .qualitativeDesc(b.getQualitativeDesc())
                        .isPass(b.isPass())
                        .build())
                .collect(Collectors.toList());

        return GradingScaleDto.builder()
                .id(scale.getId())
                .name(scale.getName())
                .scaleType(scale.getScaleType() != null ? scale.getScaleType().name() : null)
                .description(scale.getDescription())
                .boundaries(boundaryDtos)
                .build();
    }

    private CalculationRuleDto mapToCalculationRuleDto(CalculationRule rule) {
        return CalculationRuleDto.builder()
                .id(rule.getId())
                .name(rule.getName())
                .sgpaFormula(rule.getSgpaFormula())
                .cgpaFormula(rule.getCgpaFormula())
                .percentageFormulaExpression(rule.getPercentageFormulaExpression())
                .percentageFormulaDesc(rule.getPercentageFormulaDesc())
                .roundingMode(rule.getRoundingMode())
                .decimalPlaces(rule.getDecimalPlaces())
                .build();
    }
}
