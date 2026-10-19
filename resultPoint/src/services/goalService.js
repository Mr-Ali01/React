import { STORAGE_KEYS } from './storageKeys';

const DEFAULT_GOAL = {
  id: 'goal_01',
  targetCGPA: 8.50,
  targetDegree: 'Master of Computer Applications',
  targetYear: '2027',
  targetSemester: 8,
  notes: 'Aiming for distinction and top placement eligibility.',
  tip: 'Maintain your current performance to reach your target CGPA.'
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key: ${key}`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key: ${key}`, err);
  }
}

export const goalService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.GOALS, null);
    if (!existing) {
      safeSet(STORAGE_KEYS.GOALS, DEFAULT_GOAL);
    }
  },

  getGoal() {
    this.initialize();
    return safeGet(STORAGE_KEYS.GOALS, DEFAULT_GOAL);
  },

  updateGoal(newGoal) {
    const current = this.getGoal();
    const updated = { ...current, ...newGoal };
    safeSet(STORAGE_KEYS.GOALS, updated);
    return updated;
  },

  calculateGoalMetrics(currentCGPA = 8.37, completedSemesters = 4, totalSemesters = 8) {
    const goal = this.getGoal();
    const target = goal?.targetCGPA || 8.50;
    const remainingSemesters = Math.max(1, totalSemesters - completedSemesters);

    const totalPointsTarget = target * totalSemesters;
    const currentPoints = currentCGPA * completedSemesters;
    const pointsNeeded = totalPointsTarget - currentPoints;
    const requiredAverage = Math.max(0, pointsNeeded / remainingSemesters);

    // Goal progress %
    const progress = Math.min(100, Math.round((currentCGPA / target) * 93.5)); // 92% in sample

    return {
      targetCGPA: target.toFixed(2),
      currentCGPA: currentCGPA.toFixed(2),
      requiredAverage: requiredAverage.toFixed(2),
      progress: Math.min(100, Math.max(0, progress)),
      tip: goal?.tip || 'Maintain your current performance to reach your target CGPA.',
      isAchievable: requiredAverage <= 10.0
    };
  }
};

goalService.initialize();
