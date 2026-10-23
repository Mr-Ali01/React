package com.resultpoint.modules.calculation.engine;

import com.resultpoint.modules.calculation.dto.*;
import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradeBoundary;
import com.resultpoint.modules.calculation.entity.GradingScale;
import com.resultpoint.modules.calculation.formula.FormulaEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Core Academic Calculation Engine for ResultPoint.
 * Evaluates SGPA, CGPA, institutional percentage conversions, and target CGPA forecasts.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AcademicCalculationEngine {

    private final FormulaEvaluator formulaEvaluator;

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);
    private static final BigDecimal DEFAULT_MAX_MARKS = new BigDecimal("100.00");
    private static final BigDecimal PASSING_GRADE_POINT_THRESHOLD = new BigDecimal("5.00");

    /**
     * Calculates Semester Grade Point Average (SGPA).
     */
    public SgpaCalculationResponse calculateSgpa(
            List<SubjectGradeInput> subjects,
            GradingScale gradingScale,
            CalculationRule calculationRule,
            String verificationStatus
    ) {
        if (subjects == null || subjects.isEmpty()) {
            throw new IllegalArgumentException("Subject list cannot be empty for SGPA calculation");
        }

        int decimalPlaces = calculationRule != null ? calculationRule.getDecimalPlaces() : 2;
        RoundingMode mathRounding = calculationRule != null && calculationRule.getRoundingMode() != null
                ? calculationRule.getRoundingMode().toMathRoundingMode()
                : RoundingMode.HALF_UP;

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalCreditPoints = BigDecimal.ZERO;
        int totalSubjects = subjects.size();
        int passedSubjects = 0;
        int failedSubjects = 0;
        List<SubjectGradeResult> results = new ArrayList<>();

        for (int i = 0; i < subjects.size(); i++) {
            SubjectGradeInput input = subjects.get(i);
            BigDecimal credits = input.getCredits();
            if (credits == null || credits.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Subject credits must be greater than zero at index " + i);
            }

            ResolvedGrade resolved = resolveGrade(input, gradingScale);
            BigDecimal creditPoints = credits.multiply(resolved.gradePoints, MC);

            totalCredits = totalCredits.add(credits);
            totalCreditPoints = totalCreditPoints.add(creditPoints);

            if (resolved.isPass) {
                passedSubjects++;
            } else {
                failedSubjects++;
            }

            results.add(SubjectGradeResult.builder()
                    .subjectCode(input.getSubjectCode())
                    .subjectName(input.getSubjectName())
                    .credits(credits)
                    .letterGrade(resolved.letterGrade)
                    .gradePoints(resolved.gradePoints)
                    .creditPoints(creditPoints.setScale(decimalPlaces, mathRounding))
                    .isPass(resolved.isPass)
                    .qualitativeDesc(resolved.qualitativeDesc)
                    .build());
        }

        if (totalCredits.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total credits cannot be zero");
        }

        BigDecimal sgpa = totalCreditPoints.divide(totalCredits, decimalPlaces, mathRounding);
        boolean isAllPassed = failedSubjects == 0;

        String academicStanding = determineAcademicStanding(sgpa, isAllPassed);
        String explanation = String.format("SGPA = Σ(Credits × Grade Points) / Σ(Credits) = %s / %s = %s",
                totalCreditPoints.setScale(2, mathRounding).toPlainString(),
                totalCredits.toPlainString(),
                sgpa.toPlainString());

        return SgpaCalculationResponse.builder()
                .sgpa(sgpa)
                .totalCredits(totalCredits.setScale(2, mathRounding))
                .totalCreditPoints(totalCreditPoints.setScale(2, mathRounding))
                .totalSubjects(totalSubjects)
                .passedSubjects(passedSubjects)
                .failedSubjects(failedSubjects)
                .isAllPassed(isAllPassed)
                .academicStanding(academicStanding)
                .formulaExplanation(explanation)
                .gradingScaleName(gradingScale != null ? gradingScale.getName() : "Generic 10-Point")
                .verificationStatus(verificationStatus)
                .subjectResults(results)
                .build();
    }

    /**
     * Calculates Cumulative Grade Point Average (CGPA).
     */
    public CgpaCalculationResponse calculateCgpa(
            List<SemesterSgpaInput> semesters,
            CalculationRule calculationRule,
            String verificationStatus
    ) {
        if (semesters == null || semesters.isEmpty()) {
            throw new IllegalArgumentException("Semester list cannot be empty for CGPA calculation");
        }

        int decimalPlaces = calculationRule != null ? calculationRule.getDecimalPlaces() : 2;
        RoundingMode mathRounding = calculationRule != null && calculationRule.getRoundingMode() != null
                ? calculationRule.getRoundingMode().toMathRoundingMode()
                : RoundingMode.HALF_UP;

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalCreditPoints = BigDecimal.ZERO;

        for (int i = 0; i < semesters.size(); i++) {
            SemesterSgpaInput sem = semesters.get(i);
            BigDecimal credits = sem.getCredits();
            BigDecimal sgpa = sem.getSgpa();

            if (credits == null || credits.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Credits must be greater than zero for semester " + sem.getSemesterNumber());
            }
            if (sgpa == null || sgpa.compareTo(BigDecimal.ZERO) < 0 || sgpa.compareTo(BigDecimal.TEN) > 0) {
                throw new IllegalArgumentException("SGPA must be between 0.0 and 10.0 for semester " + sem.getSemesterNumber());
            }

            BigDecimal creditPoints = credits.multiply(sgpa, MC);
            totalCredits = totalCredits.add(credits);
            totalCreditPoints = totalCreditPoints.add(creditPoints);
        }

        if (totalCredits.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total cumulative credits cannot be zero");
        }

        BigDecimal cgpa = totalCreditPoints.divide(totalCredits, decimalPlaces, mathRounding);

        // Evaluate equivalent percentage if rule is configured
        BigDecimal equivalentPercentage = null;
        String percentageExplanation = null;
        if (calculationRule != null && calculationRule.getPercentageFormulaExpression() != null) {
            equivalentPercentage = formulaEvaluator.evaluateCgpaFormula(
                    calculationRule.getPercentageFormulaExpression(),
                    cgpa,
                    decimalPlaces,
                    mathRounding
            );
            percentageExplanation = String.format("%s = %s",
                    calculationRule.getPercentageFormulaDesc(),
                    calculationRule.getPercentageFormulaExpression().replace("CGPA", cgpa.toPlainString()));
        }

        String classification = determineDegreeClassification(cgpa);
        String cgpaExplanation = String.format("CGPA = Σ(Semester Credits × Semester SGPA) / Σ(Semester Credits) = %s / %s = %s",
                totalCreditPoints.setScale(2, mathRounding).toPlainString(),
                totalCredits.toPlainString(),
                cgpa.toPlainString());

        return CgpaCalculationResponse.builder()
                .cgpa(cgpa)
                .totalCredits(totalCredits.setScale(2, mathRounding))
                .totalCreditPoints(totalCreditPoints.setScale(2, mathRounding))
                .totalSemesters(semesters.size())
                .equivalentPercentage(equivalentPercentage)
                .classification(classification)
                .formulaExplanation(cgpaExplanation)
                .percentageFormulaExplanation(percentageExplanation)
                .verificationStatus(verificationStatus)
                .build();
    }

    /**
     * Calculates Required Future SGPA for target CGPA.
     * Supports both credit-weighted and semester-count aggregations, zero-remaining conditions, and feasibility scoring.
     */
    public TargetCgpaResponse calculateTargetCgpa(TargetCgpaRequest request) {
        BigDecimal currentCgpa = request.getCurrentCgpa();
        BigDecimal targetCgpa = request.getTargetCgpa();

        BigDecimal completedUnits;
        BigDecimal remainingUnits;
        String unitType;
        Integer remainingSemestersOut = null;
        BigDecimal remainingCreditsOut = null;

        if (request.getCompletedCredits() != null && request.getRemainingCredits() != null) {
            completedUnits = request.getCompletedCredits();
            remainingUnits = request.getRemainingCredits();
            unitType = "credits";
            remainingCreditsOut = remainingUnits;
            remainingSemestersOut = request.getRemainingSemesters();
        } else if (request.getCompletedSemesters() != null && request.getTotalSemesters() != null) {
            int compSem = request.getCompletedSemesters();
            int totSem = request.getTotalSemesters();
            if (compSem > totSem) {
                throw new IllegalArgumentException(String.format("Completed semesters (%d) cannot exceed total semesters (%d)", compSem, totSem));
            }
            int remSem = totSem - compSem;
            completedUnits = BigDecimal.valueOf(compSem);
            remainingUnits = BigDecimal.valueOf(remSem);
            unitType = "semesters";
            remainingSemestersOut = remSem;
        } else if (request.getCompletedSemesters() != null && request.getRemainingSemesters() != null) {
            completedUnits = BigDecimal.valueOf(request.getCompletedSemesters());
            remainingUnits = BigDecimal.valueOf(request.getRemainingSemesters());
            unitType = "semesters";
            remainingSemestersOut = request.getRemainingSemesters();
        } else {
            throw new IllegalArgumentException("Either (completedCredits and remainingCredits) or (completedSemesters and totalSemesters) must be provided");
        }

        BigDecimal totalUnits = completedUnits.add(remainingUnits);
        if (totalUnits.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total academic units (credits or semesters) cannot be zero");
        }

        // Division by zero guard: When remaining units is zero
        if (remainingUnits.compareTo(BigDecimal.ZERO) == 0) {
            boolean achieved = currentCgpa.compareTo(targetCgpa) >= 0;
            return TargetCgpaResponse.builder()
                    .currentCgpa(currentCgpa)
                    .targetCgpa(targetCgpa)
                    .requiredSgpa(achieved ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : null)
                    .isAchievable(achieved)
                    .feasibility(achieved ? "TARGET_ALREADY_ACHIEVED" : "ZERO_REMAINING_SEMESTERS")
                    .remainingSemesters(remainingSemestersOut)
                    .remainingCredits(remainingCreditsOut)
                    .maxPossibleCgpa(currentCgpa)
                    .statusMessage(achieved
                            ? String.format("Target of %s already achieved with your current CGPA of %s. No remaining %s.", targetCgpa, currentCgpa, unitType)
                            : String.format("Target of %s cannot be achieved because there are 0 remaining %s and current CGPA is %s.", targetCgpa, unitType, currentCgpa))
                    .recommendation(achieved
                            ? String.format("Congratulations! Your current CGPA (%s) satisfies or exceeds your target of %s.", currentCgpa, targetCgpa)
                            : String.format("Degree coursework is completed. Your final cumulative CGPA is %s.", currentCgpa))
                    .formulaExplanation(String.format("Target calculation with 0 remaining %s. Final CGPA is %s.", unitType, currentCgpa))
                    .build();
        }

        BigDecimal currentPoints = currentCgpa.multiply(completedUnits, MC);
        BigDecimal requiredTotalPoints = targetCgpa.multiply(totalUnits, MC);
        BigDecimal requiredFuturePoints = requiredTotalPoints.subtract(currentPoints);
        BigDecimal rawRequiredSgpa = requiredFuturePoints.divide(remainingUnits, 2, RoundingMode.HALF_UP);

        BigDecimal maxFuturePoints = BigDecimal.TEN.multiply(remainingUnits, MC);
        BigDecimal maxPossibleCgpa = currentPoints.add(maxFuturePoints).divide(totalUnits, 2, RoundingMode.HALF_UP);

        boolean isAchievable;
        String feasibility;
        BigDecimal requiredSgpa;
        String statusMessage;
        String recommendation;

        if (rawRequiredSgpa.compareTo(BigDecimal.ZERO) <= 0) {
            isAchievable = true;
            feasibility = "TARGET_ALREADY_ACHIEVED";
            requiredSgpa = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            statusMessage = String.format("Target of %s already secured by existing academic performance. Any passing SGPA will satisfy your target.", targetCgpa);
            recommendation = "Maintain minimum passing grades across remaining courses to secure your degree.";
        } else if (rawRequiredSgpa.compareTo(new BigDecimal("8.50")) <= 0) {
            isAchievable = true;
            feasibility = "ACHIEVABLE";
            requiredSgpa = rawRequiredSgpa;
            statusMessage = String.format("Achievable! You need an average SGPA of %s across your remaining %s %s.", rawRequiredSgpa, remainingUnits.toPlainString(), unitType);
            recommendation = String.format("Maintain an average SGPA of %s across remaining %s to reach your %s target.", rawRequiredSgpa, unitType, targetCgpa);
        } else if (rawRequiredSgpa.compareTo(new BigDecimal("9.50")) <= 0) {
            isAchievable = true;
            feasibility = "CHALLENGING";
            requiredSgpa = rawRequiredSgpa;
            statusMessage = String.format("Challenging! You need an average SGPA of %s across your remaining %s %s.", rawRequiredSgpa, remainingUnits.toPlainString(), unitType);
            recommendation = String.format("Maintain an average SGPA of %s across remaining %s to reach your %s target.", rawRequiredSgpa, unitType, targetCgpa);
        } else if (rawRequiredSgpa.compareTo(BigDecimal.TEN) <= 0) {
            isAchievable = true;
            feasibility = "VERY_CHALLENGING";
            requiredSgpa = rawRequiredSgpa;
            statusMessage = String.format("Very challenging! Target of %s requires near-perfect performance (average SGPA of %s).%s",
                    targetCgpa, rawRequiredSgpa, rawRequiredSgpa.compareTo(BigDecimal.TEN) == 0 ? " Maximum possible 10.00 SGPA required." : "");
            recommendation = String.format("A maximum or near-maximum grade (10.00 SGPA) is required in all remaining %s to achieve your target.", unitType);
        } else {
            isAchievable = false;
            feasibility = "NOT_ACHIEVABLE";
            requiredSgpa = rawRequiredSgpa;
            statusMessage = String.format("Target of %s is mathematically unachievable on a 10.0 scale. Required SGPA (%s) exceeds 10.00.", targetCgpa, rawRequiredSgpa);
            recommendation = String.format("Your maximum achievable final CGPA is %s. Consider revising your target CGPA accordingly.", maxPossibleCgpa);
        }

        String explanation = String.format("Required SGPA = [(Target CGPA × Total %s) - (Current CGPA × Completed %s)] / Remaining %s = [(%s × %s) - (%s × %s)] / %s = %s",
                unitType, unitType, unitType, targetCgpa, totalUnits, currentCgpa, completedUnits, remainingUnits, requiredSgpa);

        return TargetCgpaResponse.builder()
                .currentCgpa(currentCgpa)
                .targetCgpa(targetCgpa)
                .requiredSgpa(requiredSgpa)
                .isAchievable(isAchievable)
                .feasibility(feasibility)
                .remainingSemesters(remainingSemestersOut)
                .remainingCredits(remainingCreditsOut)
                .maxPossibleCgpa(maxPossibleCgpa)
                .statusMessage(statusMessage)
                .recommendation(recommendation)
                .formulaExplanation(explanation)
                .build();
    }

    /**
     * Resolves Grade Letter, Grade Points, and Pass/Fail status from Subject Input.
     */
    private ResolvedGrade resolveGrade(SubjectGradeInput input, GradingScale gradingScale) {
        // 1. If marks obtained are provided and grading scale exists, match by boundary percentage
        if (input.getMarksObtained() != null && gradingScale != null && gradingScale.getBoundaries() != null) {
            BigDecimal maxMarks = input.getMaxMarks() != null && input.getMaxMarks().compareTo(BigDecimal.ZERO) > 0
                    ? input.getMaxMarks()
                    : DEFAULT_MAX_MARKS;

            BigDecimal percentage = input.getMarksObtained().divide(maxMarks, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);

            for (GradeBoundary b : gradingScale.getBoundaries()) {
                if (percentage.compareTo(b.getMinPercentage()) >= 0 && percentage.compareTo(b.getMaxPercentage()) <= 0) {
                    return new ResolvedGrade(b.getGradeLetter(), b.getGradePoints(), b.isPass(), b.getQualitativeDesc());
                }
            }
        }

        // 2. If letter grade is provided and grading scale exists, match by letter
        if (input.getLetterGrade() != null && !input.getLetterGrade().isBlank() && gradingScale != null) {
            String letter = input.getLetterGrade().trim().toUpperCase();
            for (GradeBoundary b : gradingScale.getBoundaries()) {
                if (b.getGradeLetter().equalsIgnoreCase(letter)) {
                    return new ResolvedGrade(b.getGradeLetter(), b.getGradePoints(), b.isPass(), b.getQualitativeDesc());
                }
            }
        }

        // 3. If direct grade points are provided
        if (input.getGradePoints() != null) {
            BigDecimal gp = input.getGradePoints();
            if (gradingScale != null && gradingScale.getBoundaries() != null) {
                for (GradeBoundary b : gradingScale.getBoundaries()) {
                    if (b.getGradePoints().compareTo(gp) == 0) {
                        return new ResolvedGrade(b.getGradeLetter(), gp, b.isPass(), b.getQualitativeDesc());
                    }
                }
            }
            boolean pass = gp.compareTo(PASSING_GRADE_POINT_THRESHOLD) >= 0;
            return new ResolvedGrade(input.getLetterGrade() != null ? input.getLetterGrade() : "-", gp, pass, pass ? "Pass" : "Fail");
        }

        // 4. Fallback for generic letter grades without specific regulation
        if (input.getLetterGrade() != null && !input.getLetterGrade().isBlank()) {
            String letter = input.getLetterGrade().trim().toUpperCase();
            return mapStandardFallbackLetter(letter);
        }

        throw new IllegalArgumentException(String.format("Unable to determine grade for subject '%s': provide valid marks, grade points, or letter grade",
                input.getSubjectName() != null ? input.getSubjectName() : (input.getSubjectCode() != null ? input.getSubjectCode() : "Unknown")));
    }

    private ResolvedGrade mapStandardFallbackLetter(String letter) {
        return switch (letter) {
            case "S", "O" -> new ResolvedGrade(letter, new BigDecimal("10.00"), true, "Outstanding / Super");
            case "A+" -> new ResolvedGrade("A+", new BigDecimal("9.00"), true, "Excellent");
            case "A" -> new ResolvedGrade("A", new BigDecimal("8.00"), true, "Very Good");
            case "B+" -> new ResolvedGrade("B+", new BigDecimal("7.00"), true, "Good");
            case "B" -> new ResolvedGrade("B", new BigDecimal("6.00"), true, "Above Average");
            case "C", "D" -> new ResolvedGrade(letter, new BigDecimal("5.00"), true, "Pass");
            case "F", "AB" -> new ResolvedGrade(letter, BigDecimal.ZERO, false, "Fail");
            default -> throw new IllegalArgumentException("Unknown letter grade: '" + letter + "'. Please specify grade points or valid scale boundary.");
        };
    }

    private String determineAcademicStanding(BigDecimal sgpa, boolean isAllPassed) {
        if (!isAllPassed) {
            return "Arrears / Supplementary";
        }
        if (sgpa.compareTo(new BigDecimal("8.00")) >= 0) {
            return "First Class with Distinction";
        } else if (sgpa.compareTo(new BigDecimal("6.50")) >= 0) {
            return "First Class";
        } else if (sgpa.compareTo(new BigDecimal("5.50")) >= 0) {
            return "Second Class";
        } else {
            return "Pass Division";
        }
    }

    private String determineDegreeClassification(BigDecimal cgpa) {
        if (cgpa.compareTo(new BigDecimal("8.00")) >= 0) {
            return "First Division with Distinction";
        } else if (cgpa.compareTo(new BigDecimal("6.50")) >= 0) {
            return "First Division";
        } else if (cgpa.compareTo(new BigDecimal("5.50")) >= 0) {
            return "Second Division";
        } else if (cgpa.compareTo(new BigDecimal("5.00")) >= 0) {
            return "Pass Division";
        } else {
            return "Incomplete / Failed";
        }
    }

    private record ResolvedGrade(String letterGrade, BigDecimal gradePoints, boolean isPass, String qualitativeDesc) {}
}
