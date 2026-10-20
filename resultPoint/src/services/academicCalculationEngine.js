/**
 * ResultPoint Centralized Academic Calculation Engine
 * Pure, reliable calculation logic conforming to university regulations.
 * Eliminates ad-hoc, hard-coded formulas across calculators and result pages.
 */

export const academicCalculationEngine = {
  /**
   * Calculates SGPA for a list of course results using the configured grade scale.
   * Standard formula: SGPA = Σ(Credit_i × GradePoint_i) / Σ(Credit_i)
   */
  calculateSGPA(subjects = [], gradeScale = []) {
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
    const sgpa = Number(rawSgpa.toFixed(2));

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
   */
  calculateCGPA(historicalResults = []) {
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
    const cgpa = Number(rawCgpa.toFixed(2));

    return {
      cgpa,
      totalCredits: totalDegreeCredits,
      totalPoints: totalWeightedPoints,
      semestersCount: historicalResults.length
    };
  },

  /**
   * Converts CGPA to Percentage using the university-specific conversion formula.
   */
  convertCGPAToPercentage(cgpa = 0, formulaString = '(CGPA - 0.5) * 10') {
    const val = Number(cgpa) || 0;
    let percent = 0;
    const formulaClean = (formulaString || '').toLowerCase().replace(/\s+/g, '');

    if (formulaClean.includes('cgpa-0.5') || formulaClean.includes('(cgpa-0.5)*10')) {
      percent = Math.max(0, (val - 0.5) * 10);
    } else if (formulaClean.includes('cgpa-0.75') || formulaClean.includes('(cgpa-0.75)*10')) {
      percent = Math.max(0, (val - 0.75) * 10);
    } else if (formulaClean.includes('cgpa*9.5') || formulaClean.includes('9.5')) {
      percent = Math.min(100, val * 9.5);
    } else {
      // Default standard scale (CGPA * 10)
      percent = Math.min(100, val * 10);
    }

    return {
      percentage: Number(percent.toFixed(2)),
      formulaUsed: formulaString || 'Percentage = CGPA × 10'
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
  }
};
