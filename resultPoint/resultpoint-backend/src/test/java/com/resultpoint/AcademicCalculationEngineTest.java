package com.resultpoint;

import com.resultpoint.modules.calculation.dto.*;
import com.resultpoint.modules.calculation.engine.AcademicCalculationEngine;
import com.resultpoint.modules.calculation.entity.*;
import com.resultpoint.modules.calculation.formula.FormulaEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AcademicCalculationEngine Unit Tests")
public class AcademicCalculationEngineTest {

    private AcademicCalculationEngine engine;
    private GradingScale ouScale;
    private GradingScale standardScale;
    private CalculationRule ouRule;
    private CalculationRule ugcRule;

    @BeforeEach
    void setUp() {
        FormulaEvaluator formulaEvaluator = new FormulaEvaluator();
        engine = new AcademicCalculationEngine(formulaEvaluator);

        // OU S-Grade Scale: S (85-100), A (75-84.99), B (65-74.99), C (55-64.99), D (50-54.99), E (40-49.99), F (0-39.99)
        ouScale = GradingScale.builder()
                .id("scale_ou_cbcs_s")
                .name("Osmania University CBCS 10-Point (S-Grade)")
                .scaleType(ScaleType.TEN_POINT_S)
                .boundaries(new ArrayList<>(List.of(
                        GradeBoundary.builder().gradeLetter("S").gradePoints(new BigDecimal("10.00")).minPercentage(new BigDecimal("85.00")).maxPercentage(new BigDecimal("100.00")).isPass(true).qualitativeDesc("Super").build(),
                        GradeBoundary.builder().gradeLetter("A").gradePoints(new BigDecimal("9.00")).minPercentage(new BigDecimal("75.00")).maxPercentage(new BigDecimal("84.99")).isPass(true).qualitativeDesc("Excellent").build(),
                        GradeBoundary.builder().gradeLetter("B").gradePoints(new BigDecimal("8.00")).minPercentage(new BigDecimal("65.00")).maxPercentage(new BigDecimal("74.99")).isPass(true).qualitativeDesc("Very Good").build(),
                        GradeBoundary.builder().gradeLetter("C").gradePoints(new BigDecimal("7.00")).minPercentage(new BigDecimal("55.00")).maxPercentage(new BigDecimal("64.99")).isPass(true).qualitativeDesc("Good").build(),
                        GradeBoundary.builder().gradeLetter("D").gradePoints(new BigDecimal("6.00")).minPercentage(new BigDecimal("50.00")).maxPercentage(new BigDecimal("54.99")).isPass(true).qualitativeDesc("Fair").build(),
                        GradeBoundary.builder().gradeLetter("E").gradePoints(new BigDecimal("5.00")).minPercentage(new BigDecimal("40.00")).maxPercentage(new BigDecimal("49.99")).isPass(true).qualitativeDesc("Pass").build(),
                        GradeBoundary.builder().gradeLetter("F").gradePoints(BigDecimal.ZERO).minPercentage(BigDecimal.ZERO).maxPercentage(new BigDecimal("39.99")).isPass(false).qualitativeDesc("Fail").build()
                )))
                .build();

        // Standard O-Grade Scale: O (90-100), A+ (80-89.99), A (70-79.99), B+ (60-69.99), B (50-59.99), C (40-49.99), F (0-39.99)
        standardScale = GradingScale.builder()
                .id("scale_standard_o")
                .name("Standard UGC 10-Point (O-Grade)")
                .scaleType(ScaleType.TEN_POINT_O)
                .boundaries(new ArrayList<>(List.of(
                        GradeBoundary.builder().gradeLetter("O").gradePoints(new BigDecimal("10.00")).minPercentage(new BigDecimal("90.00")).maxPercentage(new BigDecimal("100.00")).isPass(true).qualitativeDesc("Outstanding").build(),
                        GradeBoundary.builder().gradeLetter("A+").gradePoints(new BigDecimal("9.00")).minPercentage(new BigDecimal("80.00")).maxPercentage(new BigDecimal("89.99")).isPass(true).qualitativeDesc("Excellent").build(),
                        GradeBoundary.builder().gradeLetter("A").gradePoints(new BigDecimal("8.00")).minPercentage(new BigDecimal("70.00")).maxPercentage(new BigDecimal("79.99")).isPass(true).qualitativeDesc("Very Good").build(),
                        GradeBoundary.builder().gradeLetter("B+").gradePoints(new BigDecimal("7.00")).minPercentage(new BigDecimal("60.00")).maxPercentage(new BigDecimal("69.99")).isPass(true).qualitativeDesc("Good").build(),
                        GradeBoundary.builder().gradeLetter("B").gradePoints(new BigDecimal("6.00")).minPercentage(new BigDecimal("50.00")).maxPercentage(new BigDecimal("59.99")).isPass(true).qualitativeDesc("Above Average").build(),
                        GradeBoundary.builder().gradeLetter("C").gradePoints(new BigDecimal("5.00")).minPercentage(new BigDecimal("40.00")).maxPercentage(new BigDecimal("49.99")).isPass(true).qualitativeDesc("Pass").build(),
                        GradeBoundary.builder().gradeLetter("F").gradePoints(BigDecimal.ZERO).minPercentage(BigDecimal.ZERO).maxPercentage(new BigDecimal("39.99")).isPass(false).qualitativeDesc("Fail").build()
                )))
                .build();

        ouRule = CalculationRule.builder()
                .id("rule_ou_cbcs_standard")
                .name("Osmania University CBCS Rule")
                .percentageFormulaExpression("CGPA * 10")
                .percentageFormulaDesc("Direct 10 multiplier per OU CBCS conventions")
                .roundingMode(RuleRoundingMode.HALF_UP)
                .decimalPlaces(2)
                .build();

        ugcRule = CalculationRule.builder()
                .id("rule_standard_ugc")
                .name("Standard UGC Linear Conversion")
                .percentageFormulaExpression("(CGPA - 0.75) * 10")
                .percentageFormulaDesc("AICTE and UGC recommended linear formula")
                .roundingMode(RuleRoundingMode.HALF_UP)
                .decimalPlaces(2)
                .build();
    }

    @Test
    @DisplayName("OU CBCS: 88 marks must award Grade S (10 GP) for BCA/MCA")
    void shouldAwardSGradeForOuWith88Marks() {
        List<SubjectGradeInput> subjects = List.of(
                SubjectGradeInput.builder()
                        .subjectCode("BCA101")
                        .subjectName("Programming in C")
                        .credits(new BigDecimal("4.0"))
                        .marksObtained(new BigDecimal("88.0"))
                        .maxMarks(new BigDecimal("100.0"))
                        .build()
        );

        SgpaCalculationResponse response = engine.calculateSgpa(subjects, ouScale, ouRule, "VERIFIED");

        assertEquals(new BigDecimal("10.00"), response.getSgpa());
        assertEquals("S", response.getSubjectResults().get(0).getLetterGrade());
        assertEquals(new BigDecimal("10.00"), response.getSubjectResults().get(0).getGradePoints());
        assertEquals("Super", response.getSubjectResults().get(0).getQualitativeDesc());
        assertTrue(response.isAllPassed());
    }

    @Test
    @DisplayName("Standard UGC Scale: 88 marks must award Grade A+ (9 GP), NOT Grade S or O")
    void shouldAwardAPlusGradeForStandardScaleWith88Marks() {
        List<SubjectGradeInput> subjects = List.of(
                SubjectGradeInput.builder()
                        .subjectCode("CSE101")
                        .subjectName("Data Structures")
                        .credits(new BigDecimal("4.0"))
                        .marksObtained(new BigDecimal("88.0"))
                        .maxMarks(new BigDecimal("100.0"))
                        .build()
        );

        SgpaCalculationResponse response = engine.calculateSgpa(subjects, standardScale, ugcRule, "VERIFIED");

        assertEquals(new BigDecimal("9.00"), response.getSgpa());
        assertEquals("A+", response.getSubjectResults().get(0).getLetterGrade());
        assertEquals(new BigDecimal("9.00"), response.getSubjectResults().get(0).getGradePoints());
        assertEquals("Excellent", response.getSubjectResults().get(0).getQualitativeDesc());
    }

    @Test
    @DisplayName("SGPA Calculation: Weighted credit sum across multiple subjects")
    void shouldCalculateWeightedSgpaCorrectly() {
        // Sub1: 4 credits, Grade S (10 GP) -> 40 CP
        // Sub2: 3 credits, Grade A (9 GP)  -> 27 CP
        // Sub3: 3 credits, Grade B (8 GP)  -> 24 CP
        // Total Credits = 10, Total Credit Points = 91 -> SGPA = 9.10
        List<SubjectGradeInput> subjects = List.of(
                SubjectGradeInput.builder().subjectCode("CS1").credits(new BigDecimal("4.0")).letterGrade("S").build(),
                SubjectGradeInput.builder().subjectCode("CS2").credits(new BigDecimal("3.0")).letterGrade("A").build(),
                SubjectGradeInput.builder().subjectCode("CS3").credits(new BigDecimal("3.0")).letterGrade("B").build()
        );

        SgpaCalculationResponse response = engine.calculateSgpa(subjects, ouScale, ouRule, "VERIFIED");

        assertEquals(new BigDecimal("9.10"), response.getSgpa());
        assertEquals(new BigDecimal("10.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("91.00"), response.getTotalCreditPoints());
        assertTrue(response.isAllPassed());
        assertEquals("First Class with Distinction", response.getAcademicStanding());
    }

    @Test
    @DisplayName("SGPA: Failed subject results in Arrears academic standing and isPass=false")
    void shouldHandleFailedSubject() {
        List<SubjectGradeInput> subjects = List.of(
                SubjectGradeInput.builder().subjectCode("CS1").credits(new BigDecimal("4.0")).letterGrade("S").build(),
                SubjectGradeInput.builder().subjectCode("CS2").credits(new BigDecimal("4.0")).letterGrade("F").build()
        );

        SgpaCalculationResponse response = engine.calculateSgpa(subjects, ouScale, ouRule, "VERIFIED");

        assertFalse(response.isAllPassed());
        assertEquals(1, response.getPassedSubjects());
        assertEquals(1, response.getFailedSubjects());
        assertEquals("Arrears / Supplementary", response.getAcademicStanding());
    }

    @Test
    @DisplayName("CGPA Calculation: Weighted aggregation across multiple semesters")
    void shouldCalculateCgpaAcrossSemesters() {
        // Sem 1: 20 credits, 8.50 SGPA -> 170 CP
        // Sem 2: 20 credits, 9.00 SGPA -> 180 CP
        // Total = 40 credits, 350 CP -> CGPA = 8.75
        List<SemesterSgpaInput> semesters = List.of(
                SemesterSgpaInput.builder().semesterNumber(1).credits(new BigDecimal("20.0")).sgpa(new BigDecimal("8.50")).build(),
                SemesterSgpaInput.builder().semesterNumber(2).credits(new BigDecimal("20.0")).sgpa(new BigDecimal("9.00")).build()
        );

        CgpaCalculationResponse response = engine.calculateCgpa(semesters, ouRule, "VERIFIED");

        assertEquals(new BigDecimal("8.75"), response.getCgpa());
        assertEquals(new BigDecimal("40.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("350.00"), response.getTotalCreditPoints());
        assertEquals(new BigDecimal("87.50"), response.getEquivalentPercentage());
        assertEquals("First Division with Distinction", response.getClassification());
    }

    @Test
    @DisplayName("Target CGPA: Achievable scenario")
    void shouldCalculateAchievableTargetCgpa() {
        // Current: 8.00 CGPA on 60 credits -> 480 CP
        // Target: 8.50 CGPA on 100 total credits (40 remaining) -> 850 CP
        // Required for remaining: 850 - 480 = 370 CP / 40 credits = 9.25 SGPA
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("8.00"))
                .completedCredits(new BigDecimal("60.0"))
                .targetCgpa(new BigDecimal("8.50"))
                .remainingCredits(new BigDecimal("40.0"))
                .build();

        TargetCgpaResponse response = engine.calculateTargetCgpa(request);

        assertTrue(response.isAchievable());
        assertEquals(new BigDecimal("9.25"), response.getRequiredSgpa());
    }

    @Test
    @DisplayName("Target CGPA: Mathematically unachievable scenario (> 10.00 required)")
    void shouldDetectUnachievableTargetCgpa() {
        // Current: 6.00 CGPA on 80 credits -> 480 CP
        // Target: 9.00 CGPA on 100 total credits (20 remaining) -> 900 CP
        // Required: 900 - 480 = 420 CP / 20 credits = 21.00 SGPA (> 10.00)
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("6.00"))
                .completedCredits(new BigDecimal("80.0"))
                .targetCgpa(new BigDecimal("9.00"))
                .remainingCredits(new BigDecimal("20.0"))
                .build();

        TargetCgpaResponse response = engine.calculateTargetCgpa(request);

        assertFalse(response.isAchievable());
        assertEquals(new BigDecimal("21.00"), response.getRequiredSgpa());
        assertTrue(response.getStatusMessage().contains("mathematically unachievable"));
    }

    @Test
    @DisplayName("Target CGPA: Scenario requiring exact maximum possible SGPA (10.00)")
    void shouldCalculateTargetCgpaRequiringExactMaxSgpa() {
        // Current: 8.00 CGPA on 50 credits -> 400 CP
        // Target: 9.00 CGPA on 100 total credits (50 remaining) -> 900 CP
        // Required: 900 - 400 = 500 CP / 50 credits = 10.00 SGPA
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("8.00"))
                .completedCredits(new BigDecimal("50.0"))
                .targetCgpa(new BigDecimal("9.00"))
                .remainingCredits(new BigDecimal("50.0"))
                .build();

        TargetCgpaResponse response = engine.calculateTargetCgpa(request);

        assertTrue(response.isAchievable());
        assertEquals(new BigDecimal("10.00"), response.getRequiredSgpa());
        assertEquals("VERY_CHALLENGING", response.getFeasibility());
        assertTrue(response.getStatusMessage().contains("10.00"));
    }

    @Test
    @DisplayName("Target CGPA: Target already achieved scenario")
    void shouldHandleTargetCgpaAlreadyAchieved() {
        // Current: 9.50 CGPA on 60 credits -> 570 CP
        // Target: 8.00 CGPA on 100 credits (40 remaining) -> 800 CP
        // Required: 800 - 570 = 230 CP / 40 credits = 5.75 SGPA
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("9.50"))
                .completedCredits(new BigDecimal("60.0"))
                .targetCgpa(new BigDecimal("8.00"))
                .remainingCredits(new BigDecimal("40.0"))
                .build();

        TargetCgpaResponse response = engine.calculateTargetCgpa(request);

        assertTrue(response.isAchievable());
        assertEquals(new BigDecimal("5.75"), response.getRequiredSgpa());
        assertEquals("ACHIEVABLE", response.getFeasibility());

        // Extreme case: Target 5.00 on 80 total credits (20 remaining) -> 400 CP
        // Current: 9.00 on 60 credits -> 540 CP (already > 400)
        TargetCgpaRequest extremeReq = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("9.00"))
                .completedCredits(new BigDecimal("60.0"))
                .targetCgpa(new BigDecimal("5.00"))
                .remainingCredits(new BigDecimal("20.0"))
                .build();

        TargetCgpaResponse extremeResp = engine.calculateTargetCgpa(extremeReq);

        assertTrue(extremeResp.isAchievable());
        assertEquals(new BigDecimal("0.00"), extremeResp.getRequiredSgpa());
        assertEquals("TARGET_ALREADY_ACHIEVED", extremeResp.getFeasibility());
    }

    @Test
    @DisplayName("Target CGPA: Zero remaining semesters / credits - Division by zero guard")
    void shouldHandleZeroRemainingUnits() {
        // Case A: 0 remaining credits and already achieved
        TargetCgpaRequest achievedReq = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("8.50"))
                .completedCredits(new BigDecimal("120.0"))
                .targetCgpa(new BigDecimal("8.00"))
                .remainingCredits(BigDecimal.ZERO)
                .build();

        TargetCgpaResponse achievedResp = engine.calculateTargetCgpa(achievedReq);
        assertTrue(achievedResp.isAchievable());
        assertEquals("TARGET_ALREADY_ACHIEVED", achievedResp.getFeasibility());
        assertEquals(new BigDecimal("0.00"), achievedResp.getRequiredSgpa());

        // Case B: 0 remaining credits and target NOT achieved
        TargetCgpaRequest unachievedReq = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("7.50"))
                .completedCredits(new BigDecimal("120.0"))
                .targetCgpa(new BigDecimal("8.00"))
                .remainingCredits(BigDecimal.ZERO)
                .build();

        TargetCgpaResponse unachievedResp = engine.calculateTargetCgpa(unachievedReq);
        assertFalse(unachievedResp.isAchievable());
        assertNull(unachievedResp.getRequiredSgpa());
        assertEquals("ZERO_REMAINING_SEMESTERS", unachievedResp.getFeasibility());
    }

    @Test
    @DisplayName("Target CGPA: Semester-based input (per API specification)")
    void shouldCalculateTargetCgpaUsingSemesters() {
        // Current: 7.42 CGPA, 4 completed semesters, 8 total semesters, Target: 8.50
        // Total points = 8.50 * 8 = 68.00
        // Current points = 7.42 * 4 = 29.68
        // Required future = 68.00 - 29.68 = 38.32 / 4 = 9.58 SGPA
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("7.42"))
                .completedSemesters(4)
                .totalSemesters(8)
                .targetCgpa(new BigDecimal("8.50"))
                .build();

        TargetCgpaResponse response = engine.calculateTargetCgpa(request);

        assertTrue(response.isAchievable());
        assertEquals(new BigDecimal("9.58"), response.getRequiredSgpa());
        assertEquals("VERY_CHALLENGING", response.getFeasibility());
        assertEquals(4, response.getRemainingSemesters());
    }

    @Test
    @DisplayName("Target CGPA: Reject when completed semesters exceed total semesters")
    void shouldRejectInvalidSemesterCount() {
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("7.00"))
                .completedSemesters(9)
                .totalSemesters(8)
                .targetCgpa(new BigDecimal("8.00"))
                .build();

        assertThrows(IllegalArgumentException.class, () -> engine.calculateTargetCgpa(request));
    }

    @Test
    @DisplayName("Reject zero or negative credits in subject input")
    void shouldRejectInvalidCredits() {
        List<SubjectGradeInput> subjects = List.of(
                SubjectGradeInput.builder().subjectCode("CS1").credits(BigDecimal.ZERO).letterGrade("A").build()
        );

        assertThrows(IllegalArgumentException.class, () ->
                engine.calculateSgpa(subjects, ouScale, ouRule, "VERIFIED"));
    }
}
