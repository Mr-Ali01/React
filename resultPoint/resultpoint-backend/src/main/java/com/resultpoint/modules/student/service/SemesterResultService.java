package com.resultpoint.modules.student.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.calculation.dto.CalculationRuleDto;
import com.resultpoint.modules.calculation.dto.GradeBoundaryDto;
import com.resultpoint.modules.calculation.dto.GradingScaleDto;
import com.resultpoint.modules.calculation.dto.SgpaCalculationResponse;
import com.resultpoint.modules.calculation.dto.SubjectGradeInput;
import com.resultpoint.modules.calculation.dto.SubjectGradeResult;
import com.resultpoint.modules.calculation.engine.AcademicCalculationEngine;
import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradingScale;
import com.resultpoint.modules.calculation.formula.FormulaEvaluator;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.student.domain.BacklogStatus;
import com.resultpoint.modules.student.domain.SemesterResult;
import com.resultpoint.modules.student.domain.StudentProfile;
import com.resultpoint.modules.student.domain.SubjectResult;
import com.resultpoint.modules.student.dto.AcademicHistoryDto;
import com.resultpoint.modules.student.dto.SaveSemesterResultRequest;
import com.resultpoint.modules.student.dto.SemesterResultDto;
import com.resultpoint.modules.student.dto.SubjectResultDto;
import com.resultpoint.modules.student.dto.SubjectResultInputDto;
import com.resultpoint.modules.student.repository.SemesterResultRepository;
import com.resultpoint.modules.student.repository.StudentBacklogRepository;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SemesterResultService {

    private final SemesterResultRepository semesterResultRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final StudentBacklogRepository studentBacklogRepository;
    private final AcademicCalculationEngine calculationEngine;
    private final FormulaEvaluator formulaEvaluator;
    private final StudentBacklogService studentBacklogService;
    private final ObjectMapper objectMapper;

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);

    @Transactional(readOnly = true)
    public List<SemesterResultDto> getSemesterResults(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        return semesterResultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SemesterResultDto getSemesterResultByNumber(String userId, int semesterNumber) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        SemesterResult result = semesterResultRepository.findByStudentProfileIdAndSemesterNumber(profile.getId(), semesterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("SemesterResult", "semesterNumber", semesterNumber));

        return mapToDto(result);
    }

    @Transactional(readOnly = true)
    public AcademicHistoryDto getAcademicHistory(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<SemesterResultDto> history = semesterResultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        int activeBacklogs = studentBacklogRepository.countByStudentProfileIdAndStatus(profile.getId(), BacklogStatus.ACTIVE);
        int clearedBacklogs = studentBacklogRepository.countByStudentProfileIdAndStatus(profile.getId(), BacklogStatus.CLEARED);

        String currentStanding = "IN_PROGRESS";
        if (!history.isEmpty()) {
            currentStanding = history.get(history.size() - 1).getStandingStatus();
        }

        AcademicHistoryDto.AcademicSummary summary = AcademicHistoryDto.AcademicSummary.builder()
                .totalSemestersRecorded(history.size())
                .cumulativeCgpa(profile.getCumulativeCgpa())
                .totalCreditsEarned(profile.getTotalCreditsEarned())
                .activeBacklogsCount(activeBacklogs)
                .clearedBacklogsCount(clearedBacklogs)
                .currentAcademicStanding(currentStanding)
                .build();

        return AcademicHistoryDto.builder()
                .summary(summary)
                .history(history)
                .build();
    }

    @Transactional
    public SemesterResultDto saveSemesterResult(String userId, SaveSemesterResultRequest request) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Student profile must be created before submitting results."));

        if (request.getSemesterNumber() > profile.getCourse().getTotalSemesters()) {
            throw new IllegalArgumentException(String.format("Semester %d exceeds total semesters (%d) for course %s",
                    request.getSemesterNumber(), profile.getCourse().getTotalSemesters(), profile.getCourse().getName()));
        }

        if (semesterResultRepository.existsByStudentProfileIdAndSemesterNumber(profile.getId(), request.getSemesterNumber())) {
            throw new IllegalArgumentException(String.format("Semester result for semester %d already exists. Use PUT to update.",
                    request.getSemesterNumber()));
        }

        Regulation regulation = profile.getRegulation();
        GradingScale gradingScale = regulation.getGradingScale();
        CalculationRule calcRule = regulation.getCalculationRule();

        // 1. Calculate SGPA using calculation engine
        List<SubjectGradeInput> engineInputs = request.getSubjects().stream()
                .map(s -> SubjectGradeInput.builder()
                        .subjectCode(s.getSubjectCode())
                        .subjectName(s.getSubjectName())
                        .credits(s.getCredits())
                        .letterGrade(s.getGradeLetter())
                        .gradePoints(s.getGradePoints())
                        .marksObtained(s.getInternalMarks() != null && s.getExternalMarks() != null
                                ? s.getInternalMarks().add(s.getExternalMarks())
                                : null)
                        .maxMarks(s.getMaxMarks() != null ? s.getMaxMarks() : new BigDecimal("100.00"))
                        .build())
                .collect(Collectors.toList());

        SgpaCalculationResponse sgpaResponse = calculationEngine.calculateSgpa(
                engineInputs,
                gradingScale,
                calcRule,
                regulation.getVerificationStatus().name()
        );

        // 2. Frozen snapshot generation
        String gradingScaleSnapshot = serializeGradingScale(gradingScale);
        String calcRuleSnapshot = serializeCalculationRule(calcRule);

        // 3. Create SemesterResult
        String semResultId = IdGenerator.generateSemesterResultId();
        BigDecimal creditsEarned = BigDecimal.ZERO;
        List<SubjectResult> subjectResults = new ArrayList<>();

        for (int i = 0; i < request.getSubjects().size(); i++) {
            SubjectResultInputDto inputDto = request.getSubjects().get(i);
            SubjectGradeResult evaluated = sgpaResponse.getSubjectResults().get(i);

            BigDecimal internal = inputDto.getInternalMarks();
            BigDecimal external = inputDto.getExternalMarks();
            BigDecimal total = null;
            if (internal != null || external != null) {
                total = (internal != null ? internal : BigDecimal.ZERO)
                        .add(external != null ? external : BigDecimal.ZERO);
            }

            if (evaluated.isPass()) {
                creditsEarned = creditsEarned.add(evaluated.getCredits());
            }

            SubjectResult sub = SubjectResult.builder()
                    .id(IdGenerator.generateSubjectResultId())
                    .subjectCode(evaluated.getSubjectCode())
                    .subjectName(evaluated.getSubjectName())
                    .credits(evaluated.getCredits())
                    .gradeLetter(evaluated.getLetterGrade())
                    .gradePoints(evaluated.getGradePoints())
                    .internalMarks(internal)
                    .externalMarks(external)
                    .totalMarks(total)
                    .pass(evaluated.isPass())
                    .build();

            subjectResults.add(sub);
        }

        SemesterResult semResult = SemesterResult.builder()
                .id(semResultId)
                .studentProfile(profile)
                .semesterNumber(request.getSemesterNumber())
                .academicPeriod(request.getAcademicPeriod())
                .totalCredits(sgpaResponse.getTotalCredits())
                .creditsEarned(creditsEarned)
                .sgpa(sgpaResponse.getSgpa())
                .cgpa(sgpaResponse.getSgpa()) // Temporary, will be recomputed below
                .standingStatus(sgpaResponse.getAcademicStanding())
                .ruleVersionSnapshot(regulation.getRuleVersion())
                .gradingScaleSnapshotJson(gradingScaleSnapshot)
                .calculationRuleSnapshotJson(calcRuleSnapshot)
                .subjects(new ArrayList<>())
                .build();

        for (SubjectResult sub : subjectResults) {
            sub.setSemesterResult(semResult);
            semResult.getSubjects().add(sub);
        }

        SemesterResult savedResult = semesterResultRepository.save(semResult);

        // 4. Synchronize backlogs
        studentBacklogService.syncBacklogsForResult(profile, request.getSemesterNumber(), subjectResults, request.getAcademicPeriod());

        // 5. Recalculate Cumulative CGPA across all saved semesters for this student
        recalculateCumulativeStats(profile);

        // Reload to get updated CGPA and percentage
        SemesterResult updated = semesterResultRepository.findById(savedResult.getId()).orElse(savedResult);
        log.info("Saved semester result {} for student profile {} (SGPA: {}, CGPA: {})",
                updated.getId(), profile.getId(), updated.getSgpa(), updated.getCgpa());

        return mapToDto(updated);
    }

    @Transactional
    public SemesterResultDto updateSemesterResult(String userId, int semesterNumber, SaveSemesterResultRequest request) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        SemesterResult semResult = semesterResultRepository.findByStudentProfileIdAndSemesterNumber(profile.getId(), semesterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("SemesterResult", "semesterNumber", semesterNumber));

        Regulation regulation = profile.getRegulation();
        GradingScale gradingScale = regulation.getGradingScale();
        CalculationRule calcRule = regulation.getCalculationRule();

        List<SubjectGradeInput> engineInputs = request.getSubjects().stream()
                .map(s -> SubjectGradeInput.builder()
                        .subjectCode(s.getSubjectCode())
                        .subjectName(s.getSubjectName())
                        .credits(s.getCredits())
                        .letterGrade(s.getGradeLetter())
                        .gradePoints(s.getGradePoints())
                        .marksObtained(s.getInternalMarks() != null && s.getExternalMarks() != null
                                ? s.getInternalMarks().add(s.getExternalMarks())
                                : null)
                        .maxMarks(s.getMaxMarks() != null ? s.getMaxMarks() : new BigDecimal("100.00"))
                        .build())
                .collect(Collectors.toList());

        SgpaCalculationResponse sgpaResponse = calculationEngine.calculateSgpa(
                engineInputs,
                gradingScale,
                calcRule,
                regulation.getVerificationStatus().name()
        );

        java.util.Map<String, SubjectResult> existingMap = semResult.getSubjects().stream()
                .collect(Collectors.toMap(SubjectResult::getSubjectCode, s -> s));

        BigDecimal creditsEarned = BigDecimal.ZERO;
        List<SubjectResult> updatedSubjectsList = new ArrayList<>();
        java.util.Set<String> processedCodes = new java.util.HashSet<>();

        for (int i = 0; i < request.getSubjects().size(); i++) {
            SubjectResultInputDto inputDto = request.getSubjects().get(i);
            SubjectGradeResult evaluated = sgpaResponse.getSubjectResults().get(i);

            BigDecimal internal = inputDto.getInternalMarks();
            BigDecimal external = inputDto.getExternalMarks();
            BigDecimal total = null;
            if (internal != null || external != null) {
                total = (internal != null ? internal : BigDecimal.ZERO)
                        .add(external != null ? external : BigDecimal.ZERO);
            }

            if (evaluated.isPass()) {
                creditsEarned = creditsEarned.add(evaluated.getCredits());
            }

            SubjectResult sub = existingMap.get(evaluated.getSubjectCode());
            if (sub != null) {
                sub.setSubjectName(evaluated.getSubjectName());
                sub.setCredits(evaluated.getCredits());
                sub.setGradeLetter(evaluated.getLetterGrade());
                sub.setGradePoints(evaluated.getGradePoints());
                sub.setInternalMarks(internal);
                sub.setExternalMarks(external);
                sub.setTotalMarks(total);
                sub.setPass(evaluated.isPass());
            } else {
                sub = SubjectResult.builder()
                        .id(IdGenerator.generateSubjectResultId())
                        .semesterResult(semResult)
                        .subjectCode(evaluated.getSubjectCode())
                        .subjectName(evaluated.getSubjectName())
                        .credits(evaluated.getCredits())
                        .gradeLetter(evaluated.getLetterGrade())
                        .gradePoints(evaluated.getGradePoints())
                        .internalMarks(internal)
                        .externalMarks(external)
                        .totalMarks(total)
                        .pass(evaluated.isPass())
                        .build();
                semResult.getSubjects().add(sub);
            }
            updatedSubjectsList.add(sub);
            processedCodes.add(evaluated.getSubjectCode());
        }

        // Remove subjects that are no longer in the updated request
        semResult.getSubjects().removeIf(s -> !processedCodes.contains(s.getSubjectCode()));

        semResult.setAcademicPeriod(request.getAcademicPeriod());
        semResult.setTotalCredits(sgpaResponse.getTotalCredits());
        semResult.setCreditsEarned(creditsEarned);
        semResult.setSgpa(sgpaResponse.getSgpa());
        semResult.setStandingStatus(sgpaResponse.getAcademicStanding());

        semesterResultRepository.save(semResult);
        studentBacklogService.syncBacklogsForResult(profile, semesterNumber, updatedSubjectsList, request.getAcademicPeriod());
        recalculateCumulativeStats(profile);

        SemesterResult updated = semesterResultRepository.findById(semResult.getId()).orElse(semResult);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteSemesterResult(String userId, int semesterNumber) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        if (!semesterResultRepository.existsByStudentProfileIdAndSemesterNumber(profile.getId(), semesterNumber)) {
            throw new ResourceNotFoundException("SemesterResult", "semesterNumber", semesterNumber);
        }

        semesterResultRepository.deleteByStudentProfileIdAndSemesterNumber(profile.getId(), semesterNumber);
        recalculateCumulativeStats(profile);
        log.info("Deleted semester result for semester {} (student profile {})", semesterNumber, profile.getId());
    }

    private void recalculateCumulativeStats(StudentProfile profile) {
        List<SemesterResult> allResults = semesterResultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());

        if (allResults.isEmpty()) {
            profile.setCumulativeCgpa(BigDecimal.ZERO);
            profile.setTotalCreditsEarned(BigDecimal.ZERO);
            studentProfileRepository.save(profile);
            return;
        }

        BigDecimal cumulativeCredits = BigDecimal.ZERO;
        BigDecimal cumulativeCreditPoints = BigDecimal.ZERO;
        BigDecimal cumulativeEarned = BigDecimal.ZERO;

        for (SemesterResult r : allResults) {
            BigDecimal semCredits = r.getTotalCredits();
            BigDecimal semSgpa = r.getSgpa();

            cumulativeCredits = cumulativeCredits.add(semCredits);
            cumulativeCreditPoints = cumulativeCreditPoints.add(semCredits.multiply(semSgpa, MC));
            cumulativeEarned = cumulativeEarned.add(r.getCreditsEarned());

            BigDecimal semCgpa = cumulativeCreditPoints.divide(cumulativeCredits, 2, RoundingMode.HALF_UP);
            r.setCgpa(semCgpa);

            CalculationRule rule = profile.getRegulation().getCalculationRule();
            if (rule != null && rule.getPercentageFormulaExpression() != null) {
                try {
                    BigDecimal pct = formulaEvaluator.evaluateCgpaFormula(
                            rule.getPercentageFormulaExpression(),
                            semCgpa,
                            rule.getDecimalPlaces(),
                            rule.getRoundingMode() != null ? rule.getRoundingMode().toMathRoundingMode() : RoundingMode.HALF_UP
                    );
                    r.setEquivalentPercentage(pct);
                } catch (Exception ex) {
                    log.warn("Failed to evaluate percentage for semester result {}: {}", r.getId(), ex.getMessage());
                }
            }
            semesterResultRepository.save(r);
        }

        BigDecimal finalCgpa = cumulativeCreditPoints.divide(cumulativeCredits, 2, RoundingMode.HALF_UP);
        profile.setCumulativeCgpa(finalCgpa);
        profile.setTotalCreditsEarned(cumulativeEarned);
        studentProfileRepository.save(profile);
    }

    private String serializeGradingScale(GradingScale scale) {
        if (scale == null) return "{}";
        try {
            List<GradeBoundaryDto> boundaryDtos = scale.getBoundaries() != null
                    ? scale.getBoundaries().stream()
                    .map(b -> GradeBoundaryDto.builder()
                            .id(b.getId())
                            .gradeLetter(b.getGradeLetter())
                            .gradePoints(b.getGradePoints())
                            .minPercentage(b.getMinPercentage())
                            .maxPercentage(b.getMaxPercentage())
                            .isPass(b.isPass())
                            .qualitativeDesc(b.getQualitativeDesc())
                            .build())
                    .collect(Collectors.toList())
                    : List.of();

            GradingScaleDto dto = GradingScaleDto.builder()
                    .id(scale.getId())
                    .name(scale.getName())
                    .scaleType(scale.getScaleType() != null ? scale.getScaleType().name() : null)
                    .description(scale.getDescription())
                    .boundaries(boundaryDtos)
                    .build();

            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String serializeCalculationRule(CalculationRule rule) {
        if (rule == null) return "{}";
        try {
            CalculationRuleDto dto = CalculationRuleDto.builder()
                    .id(rule.getId())
                    .name(rule.getName())
                    .sgpaFormula(rule.getSgpaFormula())
                    .cgpaFormula(rule.getCgpaFormula())
                    .percentageFormulaExpression(rule.getPercentageFormulaExpression())
                    .percentageFormulaDesc(rule.getPercentageFormulaDesc())
                    .decimalPlaces(rule.getDecimalPlaces())
                    .roundingMode(rule.getRoundingMode())
                    .build();

            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    public SemesterResultDto mapToDto(SemesterResult r) {
        List<SubjectResultDto> subDtos = r.getSubjects() != null
                ? r.getSubjects().stream()
                .map(s -> SubjectResultDto.builder()
                        .id(s.getId())
                        .subjectCode(s.getSubjectCode())
                        .subjectName(s.getSubjectName())
                        .credits(s.getCredits())
                        .gradeLetter(s.getGradeLetter())
                        .gradePoints(s.getGradePoints())
                        .internalMarks(s.getInternalMarks())
                        .externalMarks(s.getExternalMarks())
                        .totalMarks(s.getTotalMarks())
                        .pass(s.isPass())
                        .createdAt(s.getCreatedAt())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        return SemesterResultDto.builder()
                .id(r.getId())
                .studentProfileId(r.getStudentProfile().getId())
                .semesterNumber(r.getSemesterNumber())
                .academicPeriod(r.getAcademicPeriod())
                .totalCredits(r.getTotalCredits())
                .creditsEarned(r.getCreditsEarned())
                .sgpa(r.getSgpa())
                .cgpa(r.getCgpa())
                .equivalentPercentage(r.getEquivalentPercentage())
                .standingStatus(r.getStandingStatus())
                .ruleVersionSnapshot(r.getRuleVersionSnapshot())
                .gradingScaleSnapshotJson(r.getGradingScaleSnapshotJson())
                .calculationRuleSnapshotJson(r.getCalculationRuleSnapshotJson())
                .subjects(subDtos)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
