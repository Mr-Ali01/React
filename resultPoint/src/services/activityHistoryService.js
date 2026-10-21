import { STORAGE_KEYS } from './storageKeys.js';
import { authService } from './authService.js';
import { studentService } from './studentService.js';
import { settingsService } from '../features/settings/settingsService.js';

function getStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && (user.id || user.email)) {
      const idPart = (user.id || user.email).replace(/[^a-zA-Z0-9]/g, '_');
      return `${STORAGE_KEYS.ACTIVITY_HISTORY}_${idPart}`;
    }
  } catch (err) {
    console.warn('Error determining activity storage key:', err);
  }
  return STORAGE_KEYS.ACTIVITY_HISTORY;
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

/**
 * Generate initial realistic activities matching the reference image
 * Exactly totals 56 activities: 32 calculators, 12 result updates, 5 goal updates, 7 backlogs cleared.
 */
function generateSeedActivities() {
  let profile = {};
  try {
    if (typeof studentService !== 'undefined' && studentService && typeof studentService.getProfile === 'function') {
      profile = studentService.getProfile() || {};
    }
  } catch (e) {
    profile = {};
  }
  const course = profile?.course || 'BCA';
  const university = profile?.university || 'Osmania University';
  const user = authService.getCurrentUser() || {};
  const userId = user?.id || 'usr_student_01';

  // Seed activities aligned with the reference dashboard UI
  const seedList = [
    {
      id: 'act_101',
      userId,
      type: 'result',
      action: 'updated',
      title: 'Edited Semester Result',
      description: `Updated Semester 4 results (${course})`,
      timestamp: '2026-10-20T10:45:00.000Z',
      entityId: 'semester-4',
      badgeValues: ['Semester 4', course, '4 Subjects'],
      resultMetric: { label: 'SGPA', value: '8.72', color: 'emerald' },
      metadata: {
        activityType: 'Result Update',
        course,
        university,
        semester: 'Semester 4',
        semesterNumber: 4,
        totalSubjects: 4,
        previousSGPA: '8.45',
        updatedSGPA: '8.72',
        previousCGPA: '8.10',
        updatedCGPA: '8.37',
        subjectChanges: [
          { subject: 'BCA401', name: 'Machine Learning & AI', previousGrade: 'B', updatedGrade: 'B+' },
          { subject: 'BCA402', name: 'Information Security', previousGrade: 'C', updatedGrade: 'B' },
          { subject: 'BCA403', name: 'Big Data Analytics', previousGrade: 'B+', updatedGrade: 'A' },
          { subject: 'BCA404', name: 'Mobile Application Dev', previousGrade: 'A', updatedGrade: 'A' }
        ],
        remarks: 'Improved grades after re-evaluation and supplementary clearance verification.'
      }
    },
    {
      id: 'act_102',
      userId,
      type: 'goal',
      action: 'updated',
      title: 'Updated Academic Goal',
      description: 'Changed target CGPA from 8.10 to 8.50',
      timestamp: '2026-10-18T16:20:00.000Z',
      entityId: 'goal_01',
      badgeValues: ['Target CGPA', 'Goal Update'],
      resultMetric: { label: 'Target', value: '8.50', color: 'orange' },
      metadata: {
        activityType: 'Goal Update',
        course,
        university,
        previousTarget: '8.10',
        updatedTarget: '8.50',
        currentCGPA: '8.14',
        cgpaGap: '0.36',
        remainingSemesters: 2,
        requiredAverage: '8.92',
        remarks: 'Adjusted target CGPA upwards to qualify for First Class with Distinction.'
      }
    },
    {
      id: 'act_103',
      userId,
      type: 'backlog',
      action: 'cleared',
      title: 'Cleared Backlog',
      description: 'Subject BCA405 cleared on re-attempt',
      timestamp: '2026-10-15T11:12:00.000Z',
      entityId: 'backlog_BCA405_s4',
      badgeValues: ['BCA405', 'Semester 4', 'Backlog Cleared'],
      resultMetric: { label: 'Grade', value: 'C', color: 'emerald' },
      metadata: {
        activityType: 'Backlog Clearance',
        course,
        university,
        semester: 'Semester 4',
        semesterNumber: 4,
        subjectCode: 'BCA405',
        subjectName: 'Distributed Computing Lab',
        credits: 3,
        originalGrade: 'F',
        clearedGrade: 'C',
        clearedPoints: 5,
        clearedPeriod: 'Supplementary Examination (Oct 2026)',
        remarks: 'Cleared pending laboratory arrear with passing grade C on first supplementary re-attempt.'
      }
    },
    {
      id: 'act_104',
      userId,
      type: 'calculation',
      action: 'calculated',
      title: 'Used CGPA Calculator',
      description: 'Calculated CGPA from semester-wise SGPA',
      timestamp: '2026-10-12T14:30:00.000Z',
      entityId: 'calc_cgpa_1',
      badgeValues: ['Calculator', 'CGPA', '4 Semesters'],
      resultMetric: { label: 'CGPA', value: '8.72', color: 'blue' },
      metadata: {
        activityType: 'Calculator Usage',
        tool: 'CGPA Calculator',
        course,
        university,
        inputs: {
          semesters: [
            { sem: 1, sgpa: 8.10, credits: 21 },
            { sem: 2, sgpa: 8.45, credits: 21 },
            { sem: 3, sgpa: 8.60, credits: 22 },
            { sem: 4, sgpa: 8.72, credits: 22 }
          ]
        },
        output: 'Cumulative CGPA: 8.72 / 10.0',
        path: '/calculators/cgpa',
        remarks: 'Computed overall 4-semester cumulative standing based on CBCS weighted credit sum.'
      }
    },
    {
      id: 'act_105',
      userId,
      type: 'result',
      action: 'created',
      title: 'Added Semester Result',
      description: `Added Semester 4 results (${course})`,
      timestamp: '2026-10-10T09:15:00.000Z',
      entityId: 'semester-4',
      badgeValues: ['Semester 4', course, '4 Subjects'],
      resultMetric: { label: 'SGPA', value: '8.45', color: 'emerald' },
      metadata: {
        activityType: 'Result Creation',
        course,
        university,
        semester: 'Semester 4',
        semesterNumber: 4,
        totalSubjects: 4,
        creditsEarned: 22,
        sgpa: '8.45',
        cgpa: '8.37',
        status: 'Very Good',
        remarks: 'Initial result upload for Semester 4 regular examination period.'
      }
    },
    {
      id: 'act_106',
      userId,
      type: 'calculation',
      action: 'calculated',
      title: 'Used Percentage Converter',
      description: 'Converted CGPA 8.37 to Percentage',
      timestamp: '2026-10-05T18:40:00.000Z',
      entityId: 'calc_pct_1',
      badgeValues: ['Calculator', 'Percentage'],
      resultMetric: { label: 'Percentage', value: '76.2%', color: 'cyan' },
      metadata: {
        activityType: 'Calculator Usage',
        tool: 'Percentage Converter',
        course,
        university,
        inputs: { cgpa: 8.37, formula: '(CGPA - 0.75) * 10' },
        output: '76.20% (First Class with Distinction)',
        path: '/calculators/percentage',
        remarks: 'Converted official university CGPA into equivalent percentage using OU formula.'
      }
    },
    {
      id: 'act_107',
      userId,
      type: 'calculation',
      action: 'calculated',
      title: 'Used Target CGPA Calculator',
      description: 'Required average SGPA to reach 8.50',
      timestamp: '2026-09-28T13:22:00.000Z',
      entityId: 'calc_target_1',
      badgeValues: ['Calculator', 'Target CGPA'],
      resultMetric: { label: 'Req. SGPA', value: '8.63', color: 'purple' },
      metadata: {
        activityType: 'Calculator Usage',
        tool: 'Target CGPA Calculator',
        course,
        university,
        inputs: { currentCGPA: 8.10, targetCGPA: 8.50, completedSemesters: 3, totalSemesters: 6 },
        output: 'Required SGPA: 8.63 per remaining semester',
        path: '/calculators/target-cgpa',
        remarks: 'Simulation of minimum average SGPA required across Semesters 4, 5, and 6.'
      }
    },
    {
      id: 'act_108',
      userId,
      type: 'result',
      action: 'updated',
      title: 'Edited Semester Result',
      description: `Updated Semester 3 results (${course})`,
      timestamp: '2026-09-20T10:18:00.000Z',
      entityId: 'semester-3',
      badgeValues: ['Semester 3', course, '3 Subjects'],
      resultMetric: { label: 'SGPA', value: '8.10', color: 'emerald' },
      metadata: {
        activityType: 'Result Update',
        course,
        university,
        semester: 'Semester 3',
        semesterNumber: 3,
        totalSubjects: 6,
        previousSGPA: '7.85',
        updatedSGPA: '8.10',
        previousCGPA: '7.80',
        updatedCGPA: '8.02',
        subjectChanges: [
          { subject: 'BCA302', name: 'Design & Analysis of Algorithms', previousGrade: 'B', updatedGrade: 'A' },
          { subject: 'BCA305', name: 'Full Stack Web Dev', previousGrade: 'A', updatedGrade: 'S' }
        ],
        remarks: 'Updated after re-evaluation of paper marks.'
      }
    }
  ];

  // Generate 48 additional realistic chronological events to reach exactly 56 total
  const additionalTemplates = [
    // Calculator uses (32 - 3 = 29 items)
    { type: 'calculation', tool: 'SGPA Calculator', title: 'Used SGPA Calculator', desc: 'Calculated predicted Semester 4 SGPA', metric: { label: 'SGPA', value: '8.65', color: 'emerald' }, path: '/calculators/sgpa', badges: ['Calculator', 'SGPA'] },
    { type: 'calculation', tool: 'CGPA Calculator', title: 'Used CGPA Calculator', desc: 'Projected graduation honors calculation', metric: { label: 'CGPA', value: '8.40', color: 'blue' }, path: '/calculators/cgpa', badges: ['Calculator', 'CGPA'] },
    { type: 'calculation', tool: 'Result Analyzer', title: 'Used Result Analyzer', desc: 'Subject performance strength audit', metric: { label: 'Status', value: 'High Standing', color: 'emerald' }, path: '/calculators/result-analysis', badges: ['Calculator', 'Analysis'] },
    { type: 'calculation', tool: 'Percentage Converter', title: 'Used Percentage Converter', desc: 'Converted Semester 3 SGPA to percentage', metric: { label: 'Percentage', value: '81.0%', color: 'cyan' }, path: '/calculators/percentage', badges: ['Calculator', 'Percentage'] },
    { type: 'calculation', tool: 'Target CGPA Calculator', title: 'Used Target CGPA Calculator', desc: 'Evaluated aggressive 9.0 target feasibility', metric: { label: 'Status', value: 'Challenging', color: 'orange' }, path: '/calculators/target-cgpa', badges: ['Calculator', 'Target CGPA'] },
    { type: 'calculation', tool: 'Credits Calculator', title: 'Used Credits Calculator', desc: 'Degree audit of completed vs remaining credits', metric: { label: 'Credits', value: '96 / 160', color: 'purple' }, path: '/calculators/credits', badges: ['Calculator', 'Credits'] },
    { type: 'calculation', tool: 'GPA Converter', title: 'Used GPA Converter', desc: 'Converted 10-point scale to 4.0 US scale', metric: { label: 'US GPA', value: '3.75 / 4.0', color: 'blue' }, path: '/calculators/gpa', badges: ['Calculator', 'US GPA'] },
    { type: 'calculation', tool: 'Grade Calculator', title: 'Used Grade Calculator', desc: 'Exam score needed for S grade in Theory of Computation', metric: { label: 'Marks', value: '85 / 100', color: 'emerald' }, path: '/calculators/grade', badges: ['Calculator', 'Grade'] }
  ];

  const resultTemplates = [
    // Results (12 - 3 = 9 items)
    { type: 'result', action: 'created', title: 'Added Semester Result', desc: `Added Semester 3 results (${course})`, metric: { label: 'SGPA', value: '8.45', color: 'emerald' }, sem: 3 },
    { type: 'result', action: 'updated', title: 'Edited Semester Result', desc: `Updated Semester 2 results (${course})`, metric: { label: 'SGPA', value: '8.10', color: 'emerald' }, sem: 2 },
    { type: 'result', action: 'created', title: 'Added Semester Result', desc: `Added Semester 2 results (${course})`, metric: { label: 'SGPA', value: '8.10', color: 'emerald' }, sem: 2 },
    { type: 'result', action: 'updated', title: 'Edited Semester Result', desc: `Updated Semester 1 results (${course})`, metric: { label: 'SGPA', value: '7.68', color: 'emerald' }, sem: 1 },
    { type: 'result', action: 'created', title: 'Added Semester Result', desc: `Added Semester 1 results (${course})`, metric: { label: 'SGPA', value: '7.68', color: 'emerald' }, sem: 1 },
    { type: 'result', action: 'updated', title: 'Edited Semester Result', desc: 'Re-evaluated digital logic marks', metric: { label: 'SGPA', value: '7.80', color: 'emerald' }, sem: 1 },
    { type: 'result', action: 'created', title: 'Added Examination Marksheet', desc: 'Imported official verified grades', metric: { label: 'Status', value: 'Verified', color: 'blue' }, sem: 3 },
    { type: 'result', action: 'updated', title: 'Edited Semester Result', desc: 'Updated laboratory practical marks', metric: { label: 'SGPA', value: '8.30', color: 'emerald' }, sem: 2 },
    { type: 'result', action: 'created', title: 'Added Semester Result', desc: 'Initial registration of coursework', metric: { label: 'Credits', value: '21', color: 'purple' }, sem: 1 }
  ];

  const goalTemplates = [
    // Goals (5 - 1 = 4 items)
    { type: 'goal', action: 'updated', title: 'Updated Academic Goal', desc: 'Changed target CGPA from 8.00 to 8.10', metric: { label: 'Target', value: '8.10', color: 'orange' } },
    { type: 'goal', action: 'created', title: 'Created Academic Goal', desc: 'Set graduation target CGPA to 8.00', metric: { label: 'Target', value: '8.00', color: 'orange' } },
    { type: 'goal', action: 'updated', title: 'Updated Goal Target Date', desc: 'Adjusted target graduation session to May 2027', metric: { label: 'Session', value: 'May 2027', color: 'orange' } },
    { type: 'goal', action: 'updated', title: 'Refined Goal Milestone', desc: 'Updated Semester 4 milestone to 8.50 SGPA', metric: { label: 'Milestone', value: '8.50', color: 'orange' } }
  ];

  const backlogTemplates = [
    // Backlogs (7 - 1 = 6 items)
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA301 cleared on re-attempt', metric: { label: 'Grade', value: 'B', color: 'emerald' }, sem: 3, code: 'BCA301' },
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA204 cleared on supplementary', metric: { label: 'Grade', value: 'B+', color: 'emerald' }, sem: 2, code: 'BCA204' },
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA102 cleared on special exam', metric: { label: 'Grade', value: 'C', color: 'emerald' }, sem: 1, code: 'BCA102' },
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA202 cleared on re-evaluation', metric: { label: 'Grade', value: 'A', color: 'emerald' }, sem: 2, code: 'BCA202' },
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA105 cleared on supplementary', metric: { label: 'Grade', value: 'B', color: 'emerald' }, sem: 1, code: 'BCA105' },
    { type: 'backlog', action: 'cleared', title: 'Cleared Backlog', desc: 'Subject BCA101 cleared on improvement', metric: { label: 'Grade', value: 'B+', color: 'emerald' }, sem: 1, code: 'BCA101' }
  ];

  let idCounter = 200;
  let baseTime = new Date('2026-09-18T10:00:00.000Z').getTime();

  // Add remaining results (9)
  resultTemplates.forEach((t) => {
    baseTime -= 86400000 * 3;
    seedList.push({
      id: `act_${idCounter++}`,
      userId,
      type: 'result',
      action: t.action,
      title: t.title,
      description: t.desc,
      timestamp: new Date(baseTime).toISOString(),
      entityId: `semester-${t.sem}`,
      badgeValues: [`Semester ${t.sem}`, course, 'CBCS'],
      resultMetric: t.metric,
      metadata: {
        activityType: t.action === 'created' ? 'Result Creation' : 'Result Update',
        course,
        university,
        semester: `Semester ${t.sem}`,
        semesterNumber: t.sem,
        remarks: 'Official university record synchronized.'
      }
    });
  });

  // Add remaining goals (4)
  goalTemplates.forEach((t) => {
    baseTime -= 86400000 * 4;
    seedList.push({
      id: `act_${idCounter++}`,
      userId,
      type: 'goal',
      action: t.action,
      title: t.title,
      description: t.desc,
      timestamp: new Date(baseTime).toISOString(),
      entityId: 'goal_01',
      badgeValues: ['Academic Goal', 'Milestone'],
      resultMetric: t.metric,
      metadata: {
        activityType: 'Goal Update',
        course,
        university,
        remarks: 'Target CGPA projection adjusted.'
      }
    });
  });

  // Add remaining backlogs (6)
  backlogTemplates.forEach((t) => {
    baseTime -= 86400000 * 2.5;
    seedList.push({
      id: `act_${idCounter++}`,
      userId,
      type: 'backlog',
      action: 'cleared',
      title: t.title,
      description: t.desc,
      timestamp: new Date(baseTime).toISOString(),
      entityId: `backlog_${t.code}_s${t.sem}`,
      badgeValues: [t.code, `Semester ${t.sem}`, 'Backlog Cleared'],
      resultMetric: t.metric,
      metadata: {
        activityType: 'Backlog Clearance',
        course,
        university,
        semester: `Semester ${t.sem}`,
        subjectCode: t.code,
        remarks: 'Passed on supplementary re-attempt.'
      }
    });
  });

  // Add remaining calculators (29)
  for (let i = 0; i < 29; i++) {
    const tmpl = additionalTemplates[i % additionalTemplates.length];
    baseTime -= 86400000 * 1.5;
    seedList.push({
      id: `act_${idCounter++}`,
      userId,
      type: 'calculation',
      action: 'calculated',
      title: tmpl.title,
      description: tmpl.desc,
      timestamp: new Date(baseTime).toISOString(),
      entityId: `calc_${i + 10}`,
      badgeValues: tmpl.badges,
      resultMetric: tmpl.metric,
      metadata: {
        activityType: 'Calculator Usage',
        tool: tmpl.tool,
        course,
        university,
        path: tmpl.path,
        remarks: 'Interactive evaluation record.'
      }
    });
  }

  // Sort latest first
  seedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return seedList;
}

export const activityHistoryService = {
  initialize() {
    const key = getStorageKey();
    const existing = safeGet(key, null);
    if (existing === null || existing === undefined || !Array.isArray(existing)) {
      const seeded = generateSeedActivities();
      safeSet(key, seeded);
    }
  },

  getAllActivities() {
    this.initialize();
    const key = getStorageKey();
    const user = authService.getCurrentUser();
    const currentUserId = user?.id || 'usr_student_01';

    const all = safeGet(key, []);
    // Ensure strict student isolation
    return all.filter((item) => !item.userId || item.userId === currentUserId);
  },

  recordActivity({
    type = 'result',
    action = 'updated',
    title,
    description,
    entityId,
    badgeValues = [],
    resultMetric = null,
    metadata = {},
    timestamp = null
  }) {
    this.initialize();

    // Respect student calculationAutoSave preference
    if (type === 'calculation') {
      try {
        const settings = settingsService.getSettings();
        if (settings.calculationAutoSave === false) {
          return null;
        }
      } catch (err) {
        // proceed if error
      }
    }

    const key = getStorageKey();
    const user = authService.getCurrentUser();
    const currentUserId = user?.id || 'usr_student_01';
    const existing = this.getAllActivities();

    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: currentUserId,
      type, // 'result' | 'goal' | 'backlog' | 'calculation'
      action, // 'created' | 'updated' | 'deleted' | 'cleared' | 'calculated'
      title: title || 'Academic Activity Recorded',
      description: description || 'Academic record updated successfully',
      timestamp: timestamp || new Date().toISOString(),
      entityId: entityId || null,
      badgeValues: Array.isArray(badgeValues) ? badgeValues : [],
      resultMetric: resultMetric || null,
      metadata: metadata || {}
    };

    const updated = [newActivity, ...existing];
    safeSet(key, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('activity_history_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return newActivity;
  },

  addActivity(payload) {
    return this.recordActivity(payload);
  },

  deleteActivity(activityId) {
    const key = getStorageKey();
    const existing = this.getAllActivities();
    const filtered = existing.filter((a) => a.id !== activityId);
    safeSet(key, filtered);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('activity_history_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return filtered;
  },

  clearActivityHistory() {
    const key = getStorageKey();
    safeSet(key, []);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('activity_history_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return [];
  },

  getSummaryStats(customActivities = null) {
    const list = customActivities || this.getAllActivities();
    const totalActivities = list.length;
    const calculatorUsage = list.filter((a) => a.type === 'calculation').length;
    const resultUpdates = list.filter((a) => a.type === 'result').length;
    const goalUpdates = list.filter((a) => a.type === 'goal').length;
    const backlogsCleared = list.filter((a) => a.type === 'backlog').length;

    return {
      totalActivities,
      calculatorUsage,
      resultUpdates,
      goalUpdates,
      backlogsCleared
    };
  }
};

// Auto-initialize on import
activityHistoryService.initialize();
