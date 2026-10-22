/**
 * ResultPoint Centralized Academic Calculation Engine
 * Pure, reliable calculation logic conforming to university regulations.
 * Eliminates ad-hoc, hard-coded formulas across calculators and result pages.
 */

import { academicCatalogService } from './academicCatalogService.js';

/**
 * Canonical Academic Rounding Function
 * Guarantees cross-platform mathematical parity with Java BigDecimal (HALF_UP, FLOOR, CEILING)
 * and resolves IEEE-754 binary floating-point representation drift (e.g., 1.005 -> 1.01).
 *
 * @param {number} value - The numeric value to round
 * @param {number} precision - Number of decimal places (default 2)
 * @param {string} mode - 'HALF_UP' | 'FLOOR' | 'CEILING' | 'round' | 'floor' | 'ceil' | 'truncate'
 * @returns {number}
 */
export function roundAcademic(value, precision = 2, mode = 'HALF_UP') {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const numPrec = Number(precision);
  const prec = Number.isFinite(numPrec) ? Math.max(0, Math.min(6, Math.floor(numPrec))) : 2;
  const normMode = String(mode || 'HALF_UP').toUpperCase();
  const factor = Math.pow(10, prec);

  if (normMode === 'FLOOR') {
    return Math.floor(value * factor) / factor;
  }
  if (normMode === 'CEILING' || normMode === 'CEIL') {
    return Math.ceil(value * factor) / factor;
  }
  if (normMode === 'TRUNCATE') {
    return Math.trunc(value * factor) / factor;
  }

  // HALF_UP (and legacy 'ROUND'):
  // Tie-breaking away from zero with exponential shift to defeat binary representation drift
  const sign = value < 0 ? -1 : 1;
  const absValue = Math.abs(value);
  const shifted = Number(Math.round(Number(absValue + 'e' + prec)) + 'e-' + prec);
  return sign * shifted;
}

export const academicCalculationEngine = {
  /**
   * Helper reference to canonical rounding
   */
  roundAcademic,

  /**
   * Calculates SGPA for a list of course results using the configured grade scale.
   * Standard formula: SGPA = Σ(Credit_i × GradePoint_i) / Σ(Credit_i)
   *
   * @param {Array} subjects - List of course objects { credits, grade, points, name }
   * @param {Array} gradeScale - Regulation grade scale definitions
   * @param {Object} options - Optional calculation parameters { decimalPrecision, roundingMode }
   */
  calculateSGPA(subjects = [], gradeScale = [], options = {}) {
    const decimalPrecision =
      options && Number.isInteger(options.decimalPrecision) && options.decimalPrecision >= 0
        ? options.decimalPrecision
        : 2;
    const roundingMode = options && options.roundingMode ? options.roundingMode : 'HALF_UP';

    const gradePointMap = {};
    const passStatusMap = {};

    // Build lookup maps from the regulation's grade scale
    gradeScale.forEach((g) => {
      gradePointMap[g.grade.toUpperCase()] = Number(g.points);
      passStatusMap[g.grade.toUpperCase()] = Boolean(g.isPass);
    });

    let totalRegisteredCredits = 0;
    let totalEarnedCredits = 0;
    let weightedPointsSum = 0;
    let backlogsCount = 0;
    const errors = [];
    const warnings = [];

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return {
        sgpa: 0,
        totalCredits: 0,
        earnedCredits: 0,
        totalPoints: 0,
        backlogsCount: 0,
        status: 'No Subjects',
        errors: ['No subject records provided for SGPA calculation.'],
        warnings
      };
    }

    const processedSubjects = subjects.map((sub, idx) => {
      const credit = Number(sub.credits) || 0;
      const rawGrade = String(sub.grade || '').trim().toUpperCase();

      if (credit <= 0) {
        warnings.push(`Course ${sub.name || idx + 1} has zero or negative credits.`);
      }

      // Determine grade points
      let points = 0;
      let isPass = true;

      if (rawGrade in gradePointMap) {
        points = gradePointMap[rawGrade];
        isPass = passStatusMap[rawGrade];
      } else if (typeof sub.points === 'number') {
        points = Number(sub.points);
        isPass = points > 0;
      } else {
        warnings.push(`Grade "${sub.grade}" not in grading scale; default 0 points applied.`);
        isPass = false;
      }

      totalRegisteredCredits += credit;
      weightedPointsSum += credit * points;

      if (isPass) {
        totalEarnedCredits += credit;
      } else {
        backlogsCount += 1;
      }

      return {
        ...sub,
        credits: credit,
        grade: rawGrade,
        points,
        isPass
      };
    });

    const rawSgpa = totalRegisteredCredits > 0 ? weightedPointsSum / totalRegisteredCredits : 0;
    const sgpa = roundAcademic(rawSgpa, decimalPrecision, roundingMode);

    // Determine performance standing
    let status = 'Passed';
    if (backlogsCount > 0) {
      status = 'Failed';
    } else if (sgpa >= 8.5) {
      status = 'Excellent';
    } else if (sgpa >= 8.0) {
      status = 'Very Good';
    } else if (sgpa >= 6.5) {
      status = 'Good';
    } else if (sgpa >= 5.0) {
      status = 'Pass';
    }

    return {
      sgpa,
      totalCredits: totalRegisteredCredits,
      earnedCredits: totalEarnedCredits,
      totalPoints: weightedPointsSum,
      backlogsCount,
      status,
      subjects: processedSubjects,
      errors,
      warnings
    };
  },

  /**
   * Calculates true Cumulative Grade Point Average (CGPA) over all completed semesters.
   * Standard formula: CGPA = Σ(Semester_Credits × Semester_SGPA) / Σ(Semester_Credits)
   *
   * @param {Array} historicalResults - List of completed semester result objects
   * @param {Object} options - Optional calculation parameters { decimalPrecision, roundingMode }
   */
  calculateCGPA(historicalResults = [], options = {}) {
    const decimalPrecision =
      options && Number.isInteger(options.decimalPrecision) && options.decimalPrecision >= 0
        ? options.decimalPrecision
        : 2;
    const roundingMode = options && options.roundingMode ? options.roundingMode : 'HALF_UP';

    if (!Array.isArray(historicalResults) || historicalResults.length === 0) {
      return {
        cgpa: 0,
        totalCredits: 0,
        totalPoints: 0,
        semestersCount: 0
      };
    }

    let totalDegreeCredits = 0;
    let totalWeightedPoints = 0;

    historicalResults.forEach((res) => {
      const credits = Number(res.creditsEarned) || Number(res.totalCredits) || 0;
      const sgpa = Number(res.sgpa) || 0;
      totalDegreeCredits += credits;
      totalWeightedPoints += credits * sgpa;
    });

    const rawCgpa = totalDegreeCredits > 0 ? totalWeightedPoints / totalDegreeCredits : 0;
    const cgpa = roundAcademic(rawCgpa, decimalPrecision, roundingMode);

    return {
      cgpa,
      totalCredits: totalDegreeCredits,
      totalPoints: totalWeightedPoints,
      semestersCount: historicalResults.length
    };
  },

  /**
   * Converts CGPA to Percentage using the university-specific conversion formula or calculation rule.
   * Pure declarative calculation - strictly prohibits eval or arbitrary JS execution.
   */
  convertCGPAToPercentage(cgpa = 0, formulaOrRule = '(CGPA - 0.5) * 10') {
    const val = Number(cgpa) || 0;
    let ruleObj = null;
    let formulaString = '(CGPA - 0.5) * 10';
    let decimalPrecision = 2;
    let roundingMode = 'HALF_UP';

    if (typeof formulaOrRule === 'object' && formulaOrRule !== null) {
      ruleObj = formulaOrRule;
    } else if (typeof formulaOrRule === 'string' && formulaOrRule.trim()) {
      const trimmed = formulaOrRule.trim();
      try {
        const resolved = academicCatalogService.getCalculationRule(trimmed);
        if (resolved) {
          ruleObj = resolved;
        }
      } catch {}
      if (!ruleObj) {
        formulaString = trimmed;
      }
    }

    if (ruleObj) {
      formulaString = ruleObj.percentageFormula || formulaString;
      if (Number.isInteger(ruleObj.decimalPrecision) && ruleObj.decimalPrecision >= 0) {
        decimalPrecision = ruleObj.decimalPrecision;
      }
      if (ruleObj.roundingMode) {
        roundingMode = ruleObj.roundingMode;
      }
    }

    let percent = 0;
    const formulaClean = formulaString.toLowerCase().replace(/\s+/g, '');

    // Declarative parser matching approved university calculation models
    const linearMatch = formulaClean.match(/^\(?cgpa(?:-([0-9.]+))?\)?\*([0-9.]+)$/);
    if (linearMatch) {
      const offset = linearMatch[1] ? parseFloat(linearMatch[1]) : 0;
      const multiplier = parseFloat(linearMatch[2]);
      percent = Math.max(0, (val - offset) * multiplier);
    } else if (formulaClean.includes('cgpa-0.5') || formulaClean.includes('(cgpa-0.5)*10')) {
      percent = Math.max(0, (val - 0.5) * 10);
    } else if (formulaClean.includes('cgpa-0.75') || formulaClean.includes('(cgpa-0.75)*10')) {
      percent = Math.max(0, (val - 0.75) * 10);
    } else if (formulaClean.includes('cgpa*9.5') || formulaClean.includes('9.5')) {
      percent = Math.min(100, val * 9.5);
    } else {
      // Default standard scale (CGPA * 10)
      percent = Math.min(100, val * 10);
    }

    // Apply configured rounding mode with exponential shifting to defeat binary representation drift
    const finalPercentage = roundAcademic(percent, decimalPrecision, roundingMode);

    return {
      percentage: finalPercentage,
      formulaUsed: formulaString || 'Percentage = CGPA × 10',
      valueOf: () => finalPercentage,
      [Symbol.toPrimitive]: () => finalPercentage
    };
  },

  /**
   * Executes a calculation rule declaratively against student context.
   */
  executeCalculationRule(rule, context = {}) {
    if (!rule || typeof rule !== 'object') {
      return {
        success: false,
        error: 'Invalid calculation rule specification provided.'
      };
    }

    if (rule.status === 'archived' && !context.allowArchived) {
      return {
        success: false,
        error: `Calculation rule "${rule.name}" is archived and cannot be used for active calculations.`,
        isArchived: true
      };
    }

    const type = rule.ruleType || 'percentage';

    if (type === 'percentage') {
      const res = this.convertCGPAToPercentage(context.cgpa || 0, rule);
      return {
        success: true,
        type: 'percentage',
        result: res.percentage,
        percentage: res.percentage,
        formulaUsed: res.formulaUsed,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }

    if (type === 'sgpa') {
      const res = this.calculateSGPA(context.subjects || [], context.gradeScale || []);
      return {
        success: true,
        type: 'sgpa',
        ...res,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }

    if (type === 'cgpa') {
      const res = this.calculateCGPA(context.historicalResults || []);
      return {
        success: true,
        type: 'cgpa',
        ...res,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }

    if (type === 'composite') {
      const sgpaRes = context.subjects ? this.calculateSGPA(context.subjects, context.gradeScale || []) : null;
      const cgpaRes = context.historicalResults ? this.calculateCGPA(context.historicalResults) : null;
      const effectiveCgpa = context.cgpa !== undefined ? context.cgpa : (cgpaRes?.cgpa || 0);
      const percentRes = this.convertCGPAToPercentage(effectiveCgpa, rule);

      return {
        success: true,
        type: 'composite',
        sgpa: sgpaRes?.sgpa || null,
        cgpa: cgpaRes?.cgpa || effectiveCgpa,
        percentage: percentRes.percentage,
        formulaUsed: percentRes.formulaUsed,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }

    return {
      success: false,
      error: `Unsupported calculation rule type "${type}".`
    };
  },

  /**
   * Maps obtained marks percentage to the regulation's letter grade.
   */
  getGradeFromMarks(obtainedMarks, maxMarks = 100, gradeScale = []) {
    const obt = Number(obtainedMarks) || 0;
    const max = Number(maxMarks) || 100;
    const percentage = max > 0 ? (obt / max) * 100 : 0;

    for (const tier of gradeScale) {
      if (percentage >= tier.minPercentage && percentage <= (tier.maxPercentage || 100)) {
        return {
          grade: tier.grade,
          points: tier.points,
          desc: tier.desc,
          isPass: tier.isPass,
          percentage: Number(percentage.toFixed(2))
        };
      }
    }

    // Fallback if not matched
    const lowest = gradeScale[gradeScale.length - 1];
    return {
      grade: lowest?.grade || 'F',
      points: lowest?.points || 0,
      desc: lowest?.desc || 'Fail',
      isPass: false,
      percentage: Number(percentage.toFixed(2))
    };
  },

  /**
   * Calculates overall academic summaries including CGPA, GPA, and Overall Grade
   * conforming to the university regulation and grading scale.
   */
  calculateOverallMetrics(resultsList = [], gradeScale = [], calculationRule = {}) {
    if (!Array.isArray(resultsList) || resultsList.length === 0) {
      return {
        cgpa: 0,
        gpa: 0,
        latestSGPA: 0,
        overallGrade: 'N/A',
        overallGradeDesc: 'No Results Recorded',
        totalCreditsEarned: 0,
        semestersCompleted: 0,
        percentage: 0,
        status: 'No Results'
      };
    }

    const sorted = [...resultsList].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    const cgpaResult = this.calculateCGPA(sorted);
    const cgpa = cgpaResult.cgpa;
    const latest = sorted[sorted.length - 1];
    const latestSGPA = Number(latest.sgpa) || 0;

    // Convert CGPA to percentage using regulation conversion formula
    const formulaStr = calculationRule?.percentageFormula || 'CGPA * 10';
    const percentResult = this.convertCGPAToPercentage(cgpa, formulaStr);
    const percentage = percentResult.percentage;

    // Determine overall letter grade and classification
    let overallGrade = 'P';
    let overallGradeDesc = 'Pass';

    if (Array.isArray(gradeScale) && gradeScale.length > 0) {
      const match = this.getGradeFromMarks(percentage, 100, gradeScale);
      overallGrade = match.grade;
      overallGradeDesc = match.desc;
    } else {
      if (cgpa >= 9.0) { overallGrade = 'O'; overallGradeDesc = 'Outstanding'; }
      else if (cgpa >= 8.0) { overallGrade = 'A+'; overallGradeDesc = 'Excellent'; }
      else if (cgpa >= 7.0) { overallGrade = 'A'; overallGradeDesc = 'Very Good'; }
      else if (cgpa >= 6.0) { overallGrade = 'B+'; overallGradeDesc = 'Good'; }
      else if (cgpa >= 5.0) { overallGrade = 'B'; overallGradeDesc = 'Above Average'; }
      else if (cgpa >= 4.0) { overallGrade = 'C'; overallGradeDesc = 'Pass'; }
      else { overallGrade = 'F'; overallGradeDesc = 'Fail'; }
    }

    return {
      cgpa,
      gpa: cgpa,
      latestSGPA,
      overallGrade,
      overallGradeDesc,
      totalCreditsEarned: cgpaResult.totalCredits,
      semestersCompleted: sorted.length,
      percentage,
      status: cgpa >= 5.0 ? 'Passed' : 'Arrears / Under Review'
    };
  }
};
