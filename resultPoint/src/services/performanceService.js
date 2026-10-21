/**
 * ResultPoint Performance Analytics Service
 * Dynamic calculations for student performance trends, subject category masteries,
 * grade distributions, actionable insights, and university-accurate CGPA projections.
 */

import { academicCalculationEngine } from './academicCalculationEngine.js';
import { academicCatalogService } from './academicCatalogService.js';
import { backlogService } from './backlogService.js';

export const performanceService = {
  /**
   * Calculates comprehensive overview metrics for the student
   */
  getOverview(profile = {}, results = [], catalogConfig = null) {
    const sorted = [...(results || [])].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    const completedSemesters = sorted.length;
    const totalSemesters = Number(catalogConfig?.course?.totalSemesters || profile.totalSemesters || 6);
    const totalDegreeCredits = Number(catalogConfig?.course?.totalDegreeCredits || profile.totalDegreeCredits || 150);

    const cgpaResult = academicCalculationEngine.calculateCGPA(sorted);
    const currentCGPA = cgpaResult.cgpa;

    const latest = sorted[sorted.length - 1] || null;
    const latestSGPA = latest ? Number(latest.sgpa) || 0 : 0;
    const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    const previousSGPA = previous ? Number(previous.sgpa) || 0 : latestSGPA;
    const sgpaDiff = Number((latestSGPA - previousSGPA).toFixed(2));

    const totalCreditsEarned = sorted.reduce(
      (sum, sem) => sum + (Number(sem.creditsEarned || sem.totalCredits) || 0),
      0
    );

    const creditsRemaining = Math.max(0, totalDegreeCredits - totalCreditsEarned);
    const creditsPercentage = totalDegreeCredits > 0
      ? Number(((totalCreditsEarned / totalDegreeCredits) * 100).toFixed(1))
      : 0;

    const semestersRemaining = Math.max(0, totalSemesters - completedSemesters);

    // Calculate required remaining average for target 8.50 (or default distinction)
    let requiredAvgForDistinction = 0;
    if (creditsRemaining > 0 && totalDegreeCredits > 0) {
      const targetWeightedTotal = totalDegreeCredits * 8.50;
      const currentWeightedTotal = totalCreditsEarned * currentCGPA;
      const neededPoints = targetWeightedTotal - currentWeightedTotal;
      requiredAvgForDistinction = Math.max(0, Number((neededPoints / creditsRemaining).toFixed(2)));
    }

    // Determine performance standing badge
    let standingBadge = 'Good';
    let standingColor = 'blue';
    if (currentCGPA >= 9.0) {
      standingBadge = 'Outstanding';
      standingColor = 'purple';
    } else if (currentCGPA >= 8.0) {
      standingBadge = 'Very Good';
      standingColor = 'emerald';
    } else if (currentCGPA >= 7.0) {
      standingBadge = 'Good';
      standingColor = 'blue';
    } else if (currentCGPA >= 5.0) {
      standingBadge = 'Average';
      standingColor = 'amber';
    } else if (completedSemesters > 0) {
      standingBadge = 'Needs Attention';
      standingColor = 'pink';
    } else {
      standingBadge = 'No Data';
      standingColor = 'slate';
    }

    const backlogScan = backlogService.scanBacklogs(sorted);

    return {
      currentCGPA,
      currentGPA: currentCGPA,
      latestSGPA,
      previousSGPA,
      sgpaDiff,
      isDiffPositive: sgpaDiff >= 0,
      diffText: completedSemesters > 1 ? (sgpaDiff >= 0 ? `+${sgpaDiff} vs last semester` : `${sgpaDiff} vs last semester`) : 'Current semester',
      completedSemesters,
      semestersCompleted: completedSemesters,
      totalSemesters,
      semestersRemaining,
      totalCreditsEarned,
      totalCredits: totalCreditsEarned,
      totalDegreeCredits,
      degreeCredits: totalDegreeCredits,
      creditsRemaining,
      creditsPercentage,
      requiredAvgForDistinction,
      standingBadge,
      standingColor,
      performanceBadge: standingBadge,
      activeBacklogs: backlogScan.activeBacklogs,
      backlogs: backlogScan.activeBacklogs,
      backlogStatus: backlogScan.activeBacklogs === 0 ? 'All Clear' : `${backlogScan.activeBacklogs} Active`,
      universityName: catalogConfig?.university?.name || profile.university || 'University',
      courseName: catalogConfig?.course?.name || profile.course || 'Degree Program',
      regulationCode: catalogConfig?.regulation?.code || profile.regulation || 'CBCS'
    };
  },

  /**
   * Computes semester-wise performance trends with optional filtering
   */
  getSemesterTrends(results = [], rangeFilter = 'all') {
    const sorted = [...(results || [])].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    let filtered = sorted;

    if (rangeFilter === '2') {
      filtered = sorted.slice(-2);
    } else if (rangeFilter === '4') {
      filtered = sorted.slice(-4);
    }

    return filtered.map((sem) => ({
      semesterNumber: sem.semesterNumber,
      semesterTitle: sem.semesterTitle || `Sem ${sem.semesterNumber}`,
      academicPeriod: sem.academicPeriod || `Semester ${sem.semesterNumber}`,
      sgpa: Number(Number(sem.sgpa).toFixed(2)) || 0,
      cgpa: Number(Number(sem.cgpa).toFixed(2)) || 0,
      creditsEarned: Number(sem.creditsEarned || sem.totalCredits) || 0,
      totalCredits: Number(sem.totalCredits) || 0,
      subjectCount: sem.subjects ? sem.subjects.length : Number(sem.subjectCount) || 0,
      status: sem.status || 'Passed'
    }));
  },

  /**
   * Evaluates performance grouped by subject category
   */
  getSubjectCategoryPerformance(results = []) {
    const categories = {
      core: {
        id: 'core',
        name: 'Core Domain & Engineering',
        subjects: [],
        totalCredits: 0,
        weightedPoints: 0,
        icon: 'Layers'
      },
      maths: {
        id: 'maths',
        name: 'Mathematics & Basic Sciences',
        subjects: [],
        totalCredits: 0,
        weightedPoints: 0,
        icon: 'Calculator'
      },
      labs: {
        id: 'labs',
        name: 'Laboratories & Practicals',
        subjects: [],
        totalCredits: 0,
        weightedPoints: 0,
        icon: 'FlaskConical'
      },
      electives: {
        id: 'electives',
        name: 'Electives & Humanities',
        subjects: [],
        totalCredits: 0,
        weightedPoints: 0,
        icon: 'BookOpen'
      }
    };

    results.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const title = (sub.name || '').toLowerCase();
        const type = (sub.type || '').toLowerCase();
        const credits = Number(sub.credits) || 3;
        const points = typeof sub.points === 'number' ? Number(sub.points) : (sub.grade === 'S' || sub.grade === 'O' ? 10 : sub.grade === 'A+' ? 9 : sub.grade === 'A' ? 8 : sub.grade === 'B+' ? 7 : sub.grade === 'B' ? 6 : sub.grade === 'C' ? 5 : 0);

        let targetCategory = 'core';
        if (type.includes('practical') || title.includes('lab') || title.includes('workshop') || title.includes('project') || title.includes('practical')) {
          targetCategory = 'labs';
        } else if (title.includes('math') || title.includes('calculus') || title.includes('discrete') || title.includes('differential') || title.includes('probability') || title.includes('statistics') || title.includes('physics') || title.includes('chemistry')) {
          targetCategory = 'maths';
        } else if (sub.isElective || title.includes('elective') || title.includes('english') || title.includes('communicat') || title.includes('environmental') || title.includes('management') || title.includes('economics')) {
          targetCategory = 'electives';
        }

        categories[targetCategory].subjects.push({
          ...sub,
          points,
          semesterNumber: sem.semesterNumber
        });
        categories[targetCategory].totalCredits += credits;
        categories[targetCategory].weightedPoints += credits * points;
      });
    });

    return Object.values(categories).map((cat) => {
      const avgGradePoints = cat.totalCredits > 0
        ? Number((cat.weightedPoints / cat.totalCredits).toFixed(2))
        : 0;

      let standing = 'Good';
      let color = '#3B82F6';
      if (avgGradePoints >= 9.0) {
        standing = 'Outstanding';
        color = '#8B5CF6';
      } else if (avgGradePoints >= 8.0) {
        standing = 'Very Good';
        color = '#10B981';
      } else if (avgGradePoints >= 7.0) {
        standing = 'Good';
        color = '#06B6D4';
      } else if (avgGradePoints >= 5.0) {
        standing = 'Fair';
        color = '#F59E0B';
      } else {
        standing = 'Needs Focus';
        color = '#EF4444';
      }

      return {
        id: cat.id,
        name: cat.name,
        subjectCount: cat.subjects.length,
        totalCredits: cat.totalCredits,
        avgGradePoints,
        standing,
        color
      };
    }).filter(c => c.subjectCount > 0);
  },

  /**
   * Extracts exact grade distribution count and percentages from saved subjects
   */
  getGradeDistribution(results = [], gradeScale = []) {
    const counts = {};
    let totalSubjects = 0;
    let totalPass = 0;

    // Initialize counts with available grade scale or standard tiers
    const scale = Array.isArray(gradeScale) && gradeScale.length > 0 ? gradeScale : [
      { grade: 'S', points: 10, isPass: true, desc: 'Super' },
      { grade: 'A+', points: 9, isPass: true, desc: 'Excellent' },
      { grade: 'A', points: 8, isPass: true, desc: 'Very Good' },
      { grade: 'B+', points: 7, isPass: true, desc: 'Good' },
      { grade: 'B', points: 6, isPass: true, desc: 'Fair' },
      { grade: 'C', points: 5, isPass: true, desc: 'Pass' },
      { grade: 'F', points: 0, isPass: false, desc: 'Fail' }
    ];

    scale.forEach((g) => {
      counts[g.grade] = 0;
    });

    results.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const grade = (sub.grade || 'F').toUpperCase();
        counts[grade] = (counts[grade] || 0) + 1;
        totalSubjects += 1;
        if (sub.isPass !== false && grade !== 'F') {
          totalPass += 1;
        }
      });
    });

    const colors = {
      'S': '#8B5CF6',
      'O': '#8B5CF6',
      'A+': '#3B82F6',
      'A': '#06B6D4',
      'B+': '#10B981',
      'B': '#F59E0B',
      'C': '#64748B',
      'P': '#64748B',
      'F': '#EF4444'
    };

    const distribution = scale.map((item) => {
      const count = counts[item.grade] || 0;
      const percentage = totalSubjects > 0 ? Number(((count / totalSubjects) * 100).toFixed(1)) : 0;
      return {
        grade: item.grade,
        desc: item.desc || item.grade,
        points: item.points,
        count,
        percentage,
        isPass: item.isPass,
        color: colors[item.grade] || '#3B82F6'
      };
    }).filter(d => d.count > 0 || totalSubjects === 0);

    const passRate = totalSubjects > 0 ? Number(((totalPass / totalSubjects) * 100).toFixed(1)) : 0;

    return {
      distribution,
      totalSubjects,
      totalPass,
      passRate
    };
  },

  /**
   * Identifies top performing subjects ranked by grade points and credits
   */
  getTopPerformingSubjects(results = [], limit = 5) {
    const allSubjects = [];
    results.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const points = typeof sub.points === 'number'
          ? Number(sub.points)
          : (sub.grade === 'S' || sub.grade === 'O' ? 10 : sub.grade === 'A+' ? 9 : sub.grade === 'A' ? 8 : 7);
        allSubjects.push({
          code: sub.code || 'SUB',
          name: sub.name || 'Subject',
          semesterNumber: sem.semesterNumber,
          credits: Number(sub.credits) || 3,
          grade: sub.grade || 'A',
          points,
          isPass: sub.isPass !== false && sub.grade !== 'F'
        });
      });
    });

    return allSubjects
      .filter((s) => s.isPass && s.points >= 8)
      .sort((a, b) => b.points - a.points || b.credits - a.credits)
      .slice(0, limit);
  },

  /**
   * Identifies low-performing subjects and arrears that need improvement
   */
  getSubjectsToImprove(results = [], limit = 5) {
    const items = [];
    results.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const points = typeof sub.points === 'number'
          ? Number(sub.points)
          : (sub.grade === 'F' ? 0 : sub.grade === 'C' ? 5 : sub.grade === 'B' ? 6 : 7);
        const isFail = sub.grade === 'F' || sub.isPass === false;
        const credits = Number(sub.credits) || 3;

        // Needs improvement if failed or grade is B / C
        if (isFail || points <= 6 || (credits >= 4 && points <= 7)) {
          let priority = 'Medium';
          let impact = 'Low';
          if (isFail) {
            priority = 'High';
            impact = 'Critical';
          } else if (credits >= 4 && points <= 6) {
            priority = 'High';
            impact = 'High';
          } else if (points <= 5) {
            priority = 'High';
            impact = 'Medium';
          }

          items.push({
            code: sub.code || 'SUB',
            name: sub.name || 'Subject',
            semesterNumber: sem.semesterNumber,
            credits,
            grade: sub.grade || 'C',
            points,
            isFail,
            priority,
            impact
          });
        }
      });
    });

    return items
      .sort((a, b) => (a.isFail ? -1 : b.isFail ? 1 : b.credits - a.credits || a.points - b.points))
      .slice(0, limit);
  },

  /**
   * Synthesizes data-driven performance insights
   */
  generateInsights(overview, categories, topSubjects, improveSubjects) {
    const insights = [];

    // 1. Trajectory Insight
    if (overview.completedSemesters >= 2) {
      if (overview.sgpaDiff > 0) {
        insights.push({
          id: 'velocity',
          type: 'positive',
          title: 'Positive Academic Velocity',
          subtitle: `Your SGPA rose by +${overview.sgpaDiff.toFixed(2)} in Semester ${overview.completedSemesters} compared to prior semester.`,
          badge: 'Upward Trend',
          badgeColor: 'emerald'
        });
      } else if (overview.sgpaDiff < 0) {
        insights.push({
          id: 'velocity',
          type: 'warning',
          title: 'Semester Dip Observed',
          subtitle: `Your SGPA dipped by ${Math.abs(overview.sgpaDiff).toFixed(2)} points. Focus on core high-credit theory subjects.`,
          badge: 'Attention Needed',
          badgeColor: 'amber'
        });
      } else {
        insights.push({
          id: 'velocity',
          type: 'neutral',
          title: 'Consistent Velocity',
          subtitle: `You maintained a steady ${overview.latestSGPA.toFixed(2)} SGPA over consecutive terms.`,
          badge: 'Steady',
          badgeColor: 'blue'
        });
      }
    }

    // 2. Strongest Domain
    const sortedCats = [...categories].sort((a, b) => b.avgGradePoints - a.avgGradePoints);
    if (sortedCats.length > 0 && sortedCats[0].avgGradePoints >= 8.0) {
      const topCat = sortedCats[0];
      insights.push({
        id: 'strength',
        type: 'positive',
        title: 'Strongest Discipline Area',
        subtitle: `${topCat.name} with an average of ${topCat.avgGradePoints.toFixed(2)} Grade Points across ${topCat.totalCredits} credits.`,
        badge: 'Top Strength',
        badgeColor: 'purple'
      });
    }

    // 3. Area Needing Work
    if (sortedCats.length > 1) {
      const lowestCat = sortedCats[sortedCats.length - 1];
      if (lowestCat.avgGradePoints < 7.5 || improveSubjects.length > 0) {
        insights.push({
          id: 'opportunity',
          type: 'warning',
          title: 'Growth Opportunity',
          subtitle: `${lowestCat.name} averages ${lowestCat.avgGradePoints.toFixed(2)} Grade Points. Boosting higher-credit subjects will accelerate CGPA.`,
          badge: 'Improvement Area',
          badgeColor: 'amber'
        });
      }
    }

    // 4. Backlog / Clearance status
    if (overview.activeBacklogs > 0) {
      insights.push({
        id: 'backlog',
        type: 'warning',
        title: 'Arrears Detected',
        subtitle: `You currently have ${overview.activeBacklogs} uncleared subject(s). Registering in supplementary exams will restore degree eligibility.`,
        badge: 'Action Required',
        badgeColor: 'pink'
      });
    } else if (overview.completedSemesters > 0) {
      insights.push({
        id: 'backlog',
        type: 'positive',
        title: 'Zero Backlogs Standing',
        subtitle: `All registered courses cleared on the first attempt with 100% pass efficiency.`,
        badge: 'All Clear',
        badgeColor: 'emerald'
      });
    }

    return insights;
  },

  /**
   * Evaluates CGPA Projections and What-If Scenarios
   */
  getProjections(overview, targetCGPA = 8.5) {
    const currentCGPA = overview.currentCGPA || 0;
    const completedCredits = overview.totalCreditsEarned || 0;
    const totalDegreeCredits = overview.totalDegreeCredits || 150;
    const remainingCredits = Math.max(0, totalDegreeCredits - completedCredits);
    const completedSemesters = overview.completedSemesters || 0;
    const totalSemesters = overview.totalSemesters || 6;
    const remainingSemesters = Math.max(0, totalSemesters - completedSemesters);

    const estNextSemCredits = remainingSemesters > 0 ? Math.round(remainingCredits / remainingSemesters) : 22;

    // Calculate required SGPA across all remaining credits
    let requiredAverage = 0;
    let feasibility = 'Achievable';
    let feasibilityText = '';
    let isAchievable = true;

    if (remainingCredits > 0) {
      const targetPoints = totalDegreeCredits * targetCGPA;
      const currentPoints = completedCredits * currentCGPA;
      const neededPoints = targetPoints - currentPoints;
      requiredAverage = Number((neededPoints / remainingCredits).toFixed(2));

      if (requiredAverage <= 0) {
        feasibility = 'Goal Already Reached';
        feasibilityText = `Your current CGPA (${currentCGPA.toFixed(2)}) already exceeds your target graduation goal of ${targetCGPA.toFixed(2)}.`;
      } else if (requiredAverage <= 8.5) {
        feasibility = 'Achievable';
        feasibilityText = `Your target CGPA of ${targetCGPA.toFixed(2)} is achievable with an average of ${requiredAverage.toFixed(2)} across the remaining ${remainingCredits} credits.`;
      } else if (requiredAverage <= 9.5) {
        feasibility = 'Challenging';
        feasibilityText = `Target requires a strong average of ${requiredAverage.toFixed(2)} across remaining ${remainingCredits} credits. Focus heavily on 4-credit core papers.`;
      } else if (requiredAverage <= 10.0) {
        feasibility = 'High Distinction Required';
        feasibilityText = `Target requires near-perfect performance (${requiredAverage.toFixed(2)} SGPA) across all remaining ${remainingCredits} credits.`;
      } else {
        isAchievable = false;
        feasibility = 'Exceeds Maximum Scale';
        const maxPossibleCGPA = Number(((currentPoints + remainingCredits * 10.0) / totalDegreeCredits).toFixed(2));
        feasibilityText = `Mathematically exceeds the 10.0 maximum ceiling. The maximum attainable CGPA with straight 10.0s is ${maxPossibleCGPA.toFixed(2)}.`;
      }
    } else {
      feasibility = currentCGPA >= targetCGPA ? 'Target Achieved' : 'Degree Completed';
      feasibilityText = `All ${totalDegreeCredits} degree credits have been completed with final CGPA of ${currentCGPA.toFixed(2)}.`;
    }

    // What-If Scenarios for next semester & graduation
    const whatIfScenarios = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map((assumedSGPA) => {
      // Scenario A: Next semester projection
      const nextSemTotalCredits = completedCredits + estNextSemCredits;
      const nextSemPoints = completedCredits * currentCGPA + estNextSemCredits * assumedSGPA;
      const projectedNextCGPA = nextSemTotalCredits > 0 ? Number((nextSemPoints / nextSemTotalCredits).toFixed(2)) : 0;

      // Scenario B: Final degree projection if this average is maintained throughout
      const finalPoints = completedCredits * currentCGPA + remainingCredits * assumedSGPA;
      const projectedFinalCGPA = totalDegreeCredits > 0 ? Number((finalPoints / totalDegreeCredits).toFixed(2)) : 0;

      return {
        assumedSGPA,
        projectedNextCGPA,
        projectedFinalCGPA,
        diff: Number((projectedFinalCGPA - currentCGPA).toFixed(2))
      };
    });

    // Recommended semester targets
    const semesterTargets = [];
    if (remainingSemesters > 0) {
      let cumulativePoints = completedCredits * currentCGPA;
      let cumulativeCredits = completedCredits;

      for (let i = 1; i <= remainingSemesters; i++) {
        const semNum = completedSemesters + i;
        const semCred = Math.round(remainingCredits / remainingSemesters);
        const targetSGPA = Math.min(10.0, Math.max(0, requiredAverage));
        cumulativePoints += semCred * targetSGPA;
        cumulativeCredits += semCred;
        const projectedCGPA = Number((cumulativePoints / cumulativeCredits).toFixed(2));

        semesterTargets.push({
          semesterNumber: semNum,
          semesterLabel: `Semester ${semNum}`,
          remainingCredits: semCred,
          targetSGPA: Number(targetSGPA.toFixed(2)),
          projectedCGPA
        });
      }
    }

    return {
      targetCGPA,
      requiredAverage: Math.max(0, requiredAverage),
      feasibility,
      feasibilityText,
      isAchievable,
      whatIfScenarios,
      semesterTargets
    };
  }
};
