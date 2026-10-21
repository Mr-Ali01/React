import { STORAGE_KEYS } from './storageKeys.js';
import { authService } from './authService.js';
import { academicCalculationEngine } from './academicCalculationEngine.js';
import { activityHistoryService } from './activityHistoryService.js';
import { notificationService } from './notificationService.js';

const DEFAULT_GOAL = {
  id: 'goal_01',
  targetCGPA: 8.50,
  targetDegree: 'Bachelor of Computer Applications',
  targetSemester: 6,
  notes: 'Aiming for First Class with Distinction.',
  tip: 'Focus on scoring higher in core and higher-credit subjects to reach your target CGPA more easily.'
};

function getStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.GOALS}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (err) {
    console.warn('Error reading auth user for goal key:', err);
  }
  return STORAGE_KEYS.GOALS;
}

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key: ${key}`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key: ${key}`, err);
  }
}

export const goalService = {
  initialize() {
    const key = getStorageKey();
    const existing = safeGet(key, null);
    if (!existing) {
      safeSet(key, DEFAULT_GOAL);
    }
  },

  getGoal() {
    this.initialize();
    const key = getStorageKey();
    return safeGet(key, DEFAULT_GOAL);
  },

  updateGoal(newGoal) {
    const key = getStorageKey();
    const current = this.getGoal();
    const updated = { ...current, ...newGoal };
    safeSet(key, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_goals_updated'));
    }

    if (newGoal.targetCGPA !== undefined && Number(newGoal.targetCGPA) !== Number(current.targetCGPA)) {
      try {
        activityHistoryService.recordActivity({
          type: 'goal',
          action: 'updated',
          title: 'Updated Academic Goal',
          description: `Changed target CGPA from ${Number(current.targetCGPA || 8.10).toFixed(2)} to ${Number(newGoal.targetCGPA).toFixed(2)}`,
          entityId: 'goal_01',
          badgeValues: ['Target CGPA', 'Goal Update'],
          resultMetric: { label: 'Target', value: Number(newGoal.targetCGPA).toFixed(2), color: 'orange' },
          metadata: {
            activityType: 'Goal Update',
            previousTarget: Number(current.targetCGPA || 8.10).toFixed(2),
            updatedTarget: Number(newGoal.targetCGPA).toFixed(2),
            remarks: newGoal.notes || 'Target CGPA projection updated.'
          }
        });

        const progress = Math.min(100, Math.round(((Number(current.currentCGPA) || 8.37) / Number(newGoal.targetCGPA)) * 100));
        notificationService.notifyGoalProgress(newGoal.targetCGPA, progress);
      } catch (e) {
        console.warn('Activity history goal log warning:', e);
      }
    }

    return updated;
  },

  resetGoal(newCourseName = 'Degree Program', newTotalSemesters = 6) {
    const key = getStorageKey();
    const freshGoal = {
      id: `goal_${Date.now()}`,
      targetCGPA: 8.50,
      targetDegree: newCourseName,
      targetSemester: Number(newTotalSemesters) || 6,
      notes: 'Aiming for First Class with Distinction.',
      tip: 'Focus on scoring higher in core and higher-credit subjects to reach your target CGPA more easily.'
    };
    safeSet(key, freshGoal);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_goals_updated'));
    }
    return freshGoal;
  },

  /**
   * Backwards-compatible goal metrics helper
   */
  calculateGoalMetrics(currentCGPA = 8.14, completedSemesters = 4, totalSemesters = 6) {
    const goal = this.getGoal();
    const target = Number(goal?.targetCGPA) || 8.50;
    const remainingSemesters = Math.max(1, totalSemesters - completedSemesters);

    const totalPointsTarget = target * totalSemesters;
    const currentPoints = currentCGPA * completedSemesters;
    const pointsNeeded = totalPointsTarget - currentPoints;
    const requiredAverage = Math.max(0, pointsNeeded / remainingSemesters);

    const progress = Math.min(100, Math.round((currentCGPA / target) * 85));

    return {
      targetCGPA: target.toFixed(2),
      currentCGPA: currentCGPA.toFixed(2),
      requiredAverage: requiredAverage.toFixed(2),
      progress: Math.min(100, Math.max(0, progress)),
      tip: goal?.tip || 'Focus on scoring higher in core and higher-credit subjects to reach your target CGPA more easily.',
      isAchievable: requiredAverage <= 10.0
    };
  },

  /**
   * Comprehensive Goal Details calculation for the Academic Goals dashboard
   */
  calculateGoalDetails(profile = {}, results = [], catalogConfig = null, customTarget = null) {
    const sorted = [...(results || [])].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    const completedSemesters = sorted.length;
    const totalSemesters = Number(catalogConfig?.course?.totalSemesters || profile.totalSemesters || 6);
    const totalDegreeCredits = Number(catalogConfig?.course?.totalDegreeCredits || profile.totalDegreeCredits || 150);

    const goal = this.getGoal();
    const targetCGPA = Number(customTarget !== null && customTarget !== undefined ? customTarget : goal?.targetCGPA || 8.50);

    const cgpaResult = academicCalculationEngine.calculateCGPA(sorted);
    const currentCGPA = cgpaResult.cgpa;

    const completedCredits = sorted.reduce(
      (sum, sem) => sum + (Number(sem.creditsEarned || sem.totalCredits) || 0),
      0
    );

    const remainingCredits = Math.max(0, totalDegreeCredits - completedCredits);
    const semestersLeft = Math.max(0, totalSemesters - completedSemesters);
    const creditsPercentage = totalDegreeCredits > 0
      ? Number(((completedCredits / totalDegreeCredits) * 100).toFixed(2))
      : 0;

    // Required Remaining Average Calculation
    let requiredAverage = 0;
    let isAchievable = true;
    let feasibilityStatus = 'Achievable';
    let feasibilityBadge = 'Achievable';
    let feasibilityBadgeColor = 'emerald';
    let feasibilityDescription = '';

    const currentPoints = completedCredits * currentCGPA;
    const targetPoints = totalDegreeCredits * targetCGPA;
    const neededPoints = targetPoints - currentPoints;

    const maxPossibleCGPA = totalDegreeCredits > 0
      ? Number(((currentPoints + remainingCredits * 10.0) / totalDegreeCredits).toFixed(2))
      : 10.0;

    if (remainingCredits > 0) {
      requiredAverage = Number((neededPoints / remainingCredits).toFixed(2));

      if (requiredAverage <= 0) {
        feasibilityStatus = 'Target Already Exceeded';
        feasibilityBadge = 'Exceeded';
        feasibilityBadgeColor = 'emerald';
        feasibilityDescription = `Your current CGPA (${currentCGPA.toFixed(2)}) is already above your graduation goal of ${targetCGPA.toFixed(2)}. Maintain consistency!`;
      } else if (requiredAverage <= 8.50) {
        feasibilityStatus = 'Achievable';
        feasibilityBadge = 'Achievable';
        feasibilityBadgeColor = 'emerald';
        feasibilityDescription = `Your target CGPA of ${targetCGPA.toFixed(2)} is achievable with an average ${requiredAverage.toFixed(2)} in the remaining ${remainingCredits} credits.`;
      } else if (requiredAverage <= 9.50) {
        feasibilityStatus = 'Challenging';
        feasibilityBadge = 'Challenging';
        feasibilityBadgeColor = 'amber';
        feasibilityDescription = `Target requires a strong average of ${requiredAverage.toFixed(2)} across the remaining ${remainingCredits} credits. Focus heavily on 4-credit core courses.`;
      } else if (requiredAverage <= 10.00) {
        feasibilityStatus = 'High Distinction Required';
        feasibilityBadge = 'High Distinction';
        feasibilityBadgeColor = 'purple';
        feasibilityDescription = `Target requires near-perfect performance (${requiredAverage.toFixed(2)} SGPA) across all remaining ${remainingCredits} credits.`;
      } else {
        isAchievable = false;
        feasibilityStatus = 'Mathematically Unreachable';
        feasibilityBadge = 'Unreachable';
        feasibilityBadgeColor = 'rose';
        feasibilityDescription = `Mathematically exceeds the 10.0 maximum grade point scale. Maximum possible graduation CGPA with straight 10.0s is ${maxPossibleCGPA.toFixed(2)}.`;
      }
    } else {
      feasibilityStatus = currentCGPA >= targetCGPA ? 'Goal Achieved' : 'Course Completed';
      feasibilityBadge = currentCGPA >= targetCGPA ? 'Achieved' : 'Final';
      feasibilityBadgeColor = currentCGPA >= targetCGPA ? 'emerald' : 'blue';
      feasibilityDescription = `All curriculum semesters completed. Final Degree CGPA: ${currentCGPA.toFixed(2)}.`;
    }

    const cgpaGap = Math.max(0, Number((targetCGPA - currentCGPA).toFixed(2)));

    // Goal Progress Formula:
    // 50% Credit Completion + 50% Quality standing towards target
    const creditRatio = totalDegreeCredits > 0 ? Math.min(1, completedCredits / totalDegreeCredits) : 0;
    const qualityRatio = targetCGPA > 0 ? Math.min(1, currentCGPA / targetCGPA) : 0;
    const goalProgress = currentCGPA >= targetCGPA && completedSemesters === totalSemesters
      ? 100
      : Math.min(100, Math.max(0, Math.round((0.5 * creditRatio + 0.5 * qualityRatio) * 100)));

    // Current Standing Classification
    let currentStanding = 'Very Good';
    if (currentCGPA >= 9.0) currentStanding = 'Outstanding';
    else if (currentCGPA >= 8.0) currentStanding = 'Very Good';
    else if (currentCGPA >= 7.0) currentStanding = 'Good';
    else if (currentCGPA >= 5.0) currentStanding = 'Average';
    else if (completedSemesters > 0) currentStanding = 'Pass';
    else currentStanding = 'No Data';

    // Target Classification
    let targetClassification = 'Distinction';
    if (targetCGPA >= 9.0) targetClassification = 'High Distinction';
    else if (targetCGPA >= 8.5) targetClassification = 'Distinction';
    else if (targetCGPA >= 7.5) targetClassification = 'First Class';
    else if (targetCGPA >= 6.5) targetClassification = 'Second Class';
    else targetClassification = 'Pass Division';

    // What-If Analysis Matrix
    // Columns: Next Sem SGPA, Projected CGPA
    const nextSemCredits = semestersLeft > 0 ? Math.round(remainingCredits / semestersLeft) : 22;
    const whatIfScenarios = [7.0, 8.0, 8.5, 9.0, 9.5, 10.0].map((assumedSGPA) => {
      const nextSemTotalCredits = completedCredits + nextSemCredits;
      const nextSemPoints = currentPoints + nextSemCredits * assumedSGPA;
      const projectedCGPA = nextSemTotalCredits > 0
        ? Number((nextSemPoints / nextSemTotalCredits).toFixed(2))
        : 0;
      const finalDegreePoints = currentPoints + remainingCredits * assumedSGPA;
      const projectedFinalCGPA = totalDegreeCredits > 0
        ? Number((finalDegreePoints / totalDegreeCredits).toFixed(2))
        : 0;

      return {
        assumedSGPA,
        projectedNextCGPA: projectedCGPA,
        projectedFinalCGPA,
        diff: Number((projectedFinalCGPA - currentCGPA).toFixed(2))
      };
    });

    // Projected CGPA Trend (Historical actual + Future projected line)
    const historicalTrend = sorted.map((sem) => ({
      semesterNumber: sem.semesterNumber,
      semesterLabel: `Sem ${sem.semesterNumber}`,
      actualCGPA: Number(sem.cgpa) || Number(sem.sgpa) || 0,
      actualSGPA: Number(sem.sgpa) || 0,
      isProjected: false
    }));

    const projectedTrend = [];
    if (semestersLeft > 0 && historicalTrend.length > 0) {
      let cumulativePoints = currentPoints;
      let cumulativeCredits = completedCredits;

      for (let i = 1; i <= semestersLeft; i++) {
        const semNum = completedSemesters + i;
        const semCredits = Math.round(remainingCredits / semestersLeft);
        const targetSGPA = Math.min(10.0, Math.max(0, requiredAverage));
        cumulativePoints += semCredits * targetSGPA;
        cumulativeCredits += semCredits;
        const projectedCGPA = Number((cumulativePoints / cumulativeCredits).toFixed(2));

        projectedTrend.push({
          semesterNumber: semNum,
          semesterLabel: `Sem ${semNum}`,
          subLabel: `(Projected)`,
          remainingCredits: semCredits,
          targetSGPA: Number(targetSGPA.toFixed(2)),
          projectedCGPA,
          isProjected: true
        });
      }
    }

    // Recommended Semester Targets
    const recommendedSemesterTargets = projectedTrend.map((p) => ({
      semester: `Semester ${p.semesterNumber}`,
      semesterNumber: p.semesterNumber,
      remainingCredits: p.remainingCredits,
      targetSGPA: p.targetSGPA,
      projectedCGPA: p.projectedCGPA
    }));

    // Subject-Wise Priority
    // Identify low-performing or high-impact subjects from saved scorecards
    const subjectPriorities = [];
    sorted.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const points = typeof sub.points === 'number'
          ? Number(sub.points)
          : (sub.grade === 'S' || sub.grade === 'O' ? 10 : sub.grade === 'A+' ? 9 : sub.grade === 'A' ? 8 : sub.grade === 'B+' ? 7 : sub.grade === 'B' ? 6 : sub.grade === 'C' ? 5 : 0);
        const credits = Number(sub.credits) || 3;
        const grade = (sub.grade || 'C').toUpperCase();
        const isFail = grade === 'F' || sub.isPass === false;

        if (isFail || points <= 6 || (credits >= 4 && points <= 7)) {
          let priority = 'Medium';
          let priorityColor = 'amber';

          if (isFail || grade === 'C') {
            priority = 'High';
            priorityColor = 'rose';
          } else if (credits >= 4 && grade === 'B') {
            priority = 'Medium';
            priorityColor = 'amber';
          } else {
            priority = 'Low';
            priorityColor = 'blue';
          }

          subjectPriorities.push({
            name: sub.name || 'Subject',
            code: sub.code || '',
            semesterNumber: sem.semesterNumber,
            credits,
            currentGrade: grade,
            points,
            priority,
            priorityColor
          });
        }
      });
    });

    // Sort subject priorities by High > Medium > Low then by credits descending
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    subjectPriorities.sort((a, b) => {
      const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (diff !== 0) return diff;
      return b.credits - a.credits;
    });

    // Credits Impact Analysis
    const creditBuckets = {
      '5+ Credits': { range: '5+ Credits', subjects: 0, impact: 'High', color: 'rose' },
      '4 Credits': { range: '4 Credits', subjects: 0, impact: 'Medium', color: 'amber' },
      '3 Credits': { range: '3 Credits', subjects: 0, impact: 'Medium', color: 'amber' },
      '2 Credits': { range: '2 Credits', subjects: 0, impact: 'Low', color: 'blue' },
      '1 Credit': { range: '1 Credit', subjects: 0, impact: 'Low', color: 'blue' }
    };

    sorted.forEach((sem) => {
      (sem.subjects || []).forEach((sub) => {
        const c = Number(sub.credits) || 3;
        if (c >= 5) creditBuckets['5+ Credits'].subjects += 1;
        else if (c === 4) creditBuckets['4 Credits'].subjects += 1;
        else if (c === 3) creditBuckets['3 Credits'].subjects += 1;
        else if (c === 2) creditBuckets['2 Credits'].subjects += 1;
        else creditBuckets['1 Credit'].subjects += 1;
      });
    });

    const creditsImpactAnalysis = Object.values(creditBuckets);

    // Personalized Tip Generation
    let personalizedTip = 'Focus on scoring higher in core and higher-credit subjects to reach your target CGPA more easily.';
    if (subjectPriorities.some(s => s.priority === 'High' && s.credits >= 4)) {
      const highSub = subjectPriorities.find(s => s.priority === 'High' && s.credits >= 4);
      personalizedTip = `Scoring an A or higher in 4-credit papers like "${highSub.name}" provides the fastest route to bridge your ${cgpaGap} CGPA gap.`;
    } else if (requiredAverage <= currentCGPA) {
      personalizedTip = `You are on pace! Maintaining your recent SGPA across remaining semesters will comfortably secure your ${targetCGPA.toFixed(2)} target.`;
    } else if (requiredAverage > 9.0) {
      personalizedTip = `Target requires high-distinction scores in labs and core theory. Ensure no papers drop below 8 grade points.`;
    }

    return {
      currentCGPA,
      targetCGPA,
      currentStanding,
      targetClassification,
      semestersCompleted: completedSemesters,
      totalSemesters,
      semestersLeft,
      completedCredits,
      totalDegreeCredits,
      remainingCredits,
      creditsPercentage,
      requiredAverage,
      cgpaGap,
      goalProgress,
      isAchievable,
      maxPossibleCGPA,
      feasibilityStatus,
      feasibilityBadge,
      feasibilityBadgeColor,
      feasibilityDescription,
      whatIfScenarios,
      historicalTrend,
      projectedTrend,
      recommendedSemesterTargets,
      subjectPriorities: subjectPriorities.slice(0, 5),
      creditsImpactAnalysis,
      personalizedTip,
      universityName: catalogConfig?.university?.shortName || catalogConfig?.university?.name || profile.university || 'University'
    };
  }
};
