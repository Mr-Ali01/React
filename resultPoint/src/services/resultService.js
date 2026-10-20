import { STORAGE_KEYS } from './storageKeys';
import { academicCalculationEngine } from './academicCalculationEngine';

// Default semester results matching the reference image exactly (S grade for MCA 10 points)
export const DEMO_STUDENT_RESULTS = [
  {
    id: 'semester-4',
    semesterNumber: 4,
    semesterLabel: 'Semester 4',
    semesterTitle: 'Semester 4',
    academicPeriod: 'Sep 2026',
    subjectCount: 6,
    creditsEarned: 22,
    totalCredits: 22,
    sgpa: 8.72,
    cgpa: 8.37,
    status: 'Excellent',
    badgeColor: 'purple',
    subjects: [
      { code: 'CS401', name: 'Machine Learning & AI', credits: 4, grade: 'S', points: 10 },
      { code: 'CS402', name: 'Information Security', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS403', name: 'Big Data Analytics', credits: 4, grade: 'A', points: 8 },
      { code: 'CS404', name: 'Mobile Application Dev', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS405', name: 'Distributed Systems', credits: 3, grade: 'A', points: 8 },
      { code: 'CS406', name: 'AI & Security Lab', credits: 3, grade: 'S', points: 10 }
    ]
  },
  {
    id: 'semester-3',
    semesterNumber: 3,
    semesterLabel: 'Semester 3',
    semesterTitle: 'Semester 3',
    academicPeriod: 'Mar 2026',
    subjectCount: 6,
    creditsEarned: 22,
    totalCredits: 22,
    sgpa: 8.45,
    cgpa: 8.10,
    status: 'Very Good',
    badgeColor: 'blue',
    subjects: [
      { code: 'CS301', name: 'Object Oriented Software Dev', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS302', name: 'Design & Analysis of Algorithms', credits: 4, grade: 'A', points: 8 },
      { code: 'CS303', name: 'Theory of Computation', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS304', name: 'Cloud Computing & DevOps', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS305', name: 'Full Stack Web Dev', credits: 3, grade: 'S', points: 10 },
      { code: 'CS306', name: 'Algorithm Lab', credits: 3, grade: 'A+', points: 9 }
    ]
  },
  {
    id: 'semester-2',
    semesterNumber: 2,
    semesterLabel: 'Semester 2',
    semesterTitle: 'Semester 2',
    academicPeriod: 'Sep 2025',
    subjectCount: 6,
    creditsEarned: 21,
    totalCredits: 21,
    sgpa: 8.10,
    cgpa: 7.89,
    status: 'Very Good',
    badgeColor: 'emerald',
    subjects: [
      { code: 'CS201', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS202', name: 'Database Management Systems', credits: 4, grade: 'A', points: 8 },
      { code: 'CS203', name: 'Computer Networks', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS204', name: 'Operating Systems', credits: 3, grade: 'A', points: 8 },
      { code: 'CS205', name: 'Probability & Statistics', credits: 3, grade: 'B+', points: 7 },
      { code: 'CS206', name: 'DBMS & DS Lab', credits: 3, grade: 'S', points: 10 }
    ]
  },
  {
    id: 'semester-1',
    semesterNumber: 1,
    semesterLabel: 'Semester 1',
    semesterTitle: 'Semester 1',
    academicPeriod: 'Mar 2025',
    subjectCount: 5,
    creditsEarned: 21,
    totalCredits: 21,
    sgpa: 7.68,
    cgpa: 7.68,
    status: 'Good',
    badgeColor: 'orange',
    subjects: [
      { code: 'CS101', name: 'Programming in C', credits: 4, grade: 'A', points: 8 },
      { code: 'CS102', name: 'Discrete Mathematics', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS103', name: 'Digital Logic & Architecture', credits: 4, grade: 'A', points: 8 },
      { code: 'CS104', name: 'Web Fundamentals', credits: 3, grade: 'A+', points: 9 },
      { code: 'CS105', name: 'Software Engineering', credits: 3, grade: 'B', points: 6 },
      { code: 'CS106', name: 'Programming Lab', credits: 3, grade: 'A+', points: 9 }
    ]
  }
];

const DEFAULT_RESULTS = DEMO_STUDENT_RESULTS;

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

/**
 * Recomputes progressive CGPA for all semesters in ascending order
 */
function recalculateProgressiveCGPAs(resultsList) {
  if (!Array.isArray(resultsList) || resultsList.length === 0) return [];

  // Sort ascending by semesterNumber
  const sorted = [...resultsList].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));

  const updated = sorted.map((res, idx) => {
    // Slices from sem 1 up to current sem
    const historicalSlice = sorted.slice(0, idx + 1);
    const cgpaResult = academicCalculationEngine.calculateCGPA(historicalSlice);
    return {
      ...res,
      cgpa: cgpaResult.cgpa
    };
  });

  return updated;
}

export const resultService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.RESULTS, null);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      safeSet(STORAGE_KEYS.RESULTS, DEFAULT_RESULTS);
    } else {
      // Check if student profile is MCA or BCA under Osmania and has legacy 'O' grades
      const profile = safeGet(STORAGE_KEYS.STUDENT, null);
      if (profile && ['mca', 'bca'].includes(profile.courseId) && (profile.universityId === 'osmania' || !profile.universityId)) {
        let hasLegacyO = false;
        const sanitized = existing.map((sem) => {
          if (!sem.subjects) return sem;
          const updatedSubs = sem.subjects.map((sub) => {
            if (sub.grade === 'O') {
              hasLegacyO = true;
              return { ...sub, grade: 'S' };
            }
            return sub;
          });
          return { ...sem, subjects: updatedSubs };
        });
        if (hasLegacyO) {
          safeSet(STORAGE_KEYS.RESULTS, sanitized);
        }
      }
    }
  },

  getAllResults() {
    this.initialize();
    return safeGet(STORAGE_KEYS.RESULTS, DEFAULT_RESULTS);
  },

  getStudentResults() {
    const results = this.getAllResults();
    return results.map((r) => {
      // Determine appropriate status if not already designated
      let calculatedStatus = r.status;
      if (!calculatedStatus || calculatedStatus === 'Passed') {
        if (r.sgpa >= 8.5) calculatedStatus = 'Excellent';
        else if (r.sgpa >= 8.0) calculatedStatus = 'Very Good';
        else if (r.sgpa >= 7.0) calculatedStatus = 'Good';
        else calculatedStatus = 'Average';
      }

      return {
        id: r.id || `semester-${r.semesterNumber}`,
        semesterNumber: Number(r.semesterNumber),
        semesterLabel: r.semesterLabel || r.semesterTitle || `Semester ${r.semesterNumber}`,
        academicPeriod: r.academicPeriod || 'Academic Period',
        subjectCount: r.subjectCount || (r.subjects ? r.subjects.length : 6),
        totalCredits: Number(r.totalCredits || r.creditsEarned || 20),
        creditsEarned: Number(r.creditsEarned || r.totalCredits || 20),
        sgpa: Number(r.sgpa) || 0,
        cgpa: Number(r.cgpa || r.sgpa) || 0,
        status: calculatedStatus,
        subjects: r.subjects || []
      };
    });
  },

  getRecentResults(limit = 4) {
    const results = this.getAllResults();
    // Sort descending by semesterNumber (S4, S3, S2, S1)
    return [...results].sort((a, b) => b.semesterNumber - a.semesterNumber).slice(0, limit);
  },

  getResultById(id) {
    const results = this.getAllResults();
    const cleanId = String(id).replace('semester-', '').replace('res_sem_', '');
    return (
      results.find(
        (r) =>
          r.id === id ||
          String(r.semesterNumber) === String(id) ||
          String(r.semesterNumber) === cleanId ||
          r.id === `semester-${id}` ||
          r.id === `res_sem_${id}` ||
          r.id === `semester-${cleanId}` ||
          r.id === `res_sem_${cleanId}`
      ) || null
    );
  },

  addResult(newResult) {
    const results = this.getAllResults();
    const resultToSave = {
      id: newResult.id || `res_sem_${Date.now()}`,
      semesterNumber: Number(newResult.semesterNumber) || results.length + 1,
      semesterTitle: newResult.semesterTitle || `Semester ${newResult.semesterNumber || results.length + 1}`,
      semesterLabel: newResult.semesterLabel || `Semester ${newResult.semesterNumber || results.length + 1}`,
      academicPeriod: newResult.academicPeriod || 'Current Period',
      sgpa: Number(newResult.sgpa) || 0,
      cgpa: Number(newResult.cgpa) || Number(newResult.sgpa) || 0,
      creditsEarned: Number(newResult.creditsEarned) || 20,
      totalCredits: Number(newResult.totalCredits) || 20,
      status: newResult.status || 'Passed',
      badgeColor: newResult.badgeColor || 'blue',
      subjects: newResult.subjects || [],
      universityId: newResult.universityId,
      courseId: newResult.courseId,
      regulationId: newResult.regulationId,
      ruleVersion: newResult.ruleVersion,
      academicBatch: newResult.academicBatch
    };

    const combined = [...results, resultToSave];
    const normalized = recalculateProgressiveCGPAs(combined);
    safeSet(STORAGE_KEYS.RESULTS, normalized);
    return normalized.find((r) => r.id === resultToSave.id) || resultToSave;
  },

  updateResult(id, updatedFields) {
    const results = this.getAllResults();
    const cleanId = String(id).replace('semester-', '').replace('res_sem_', '');
    const index = results.findIndex(
      (r) =>
        r.id === id ||
        String(r.semesterNumber) === String(id) ||
        String(r.semesterNumber) === cleanId ||
        r.id === `semester-${id}` ||
        r.id === `res_sem_${id}` ||
        r.id === `semester-${cleanId}` ||
        r.id === `res_sem_${cleanId}`
    );
    if (index !== -1) {
      results[index] = { ...results[index], ...updatedFields };
      const normalized = recalculateProgressiveCGPAs(results);
      safeSet(STORAGE_KEYS.RESULTS, normalized);
      return normalized[index];
    }
    return null;
  },

  deleteResult(id) {
    const results = this.getAllResults();
    const cleanId = String(id).replace('semester-', '').replace('res_sem_', '');
    const filtered = results.filter(
      (r) =>
        r.id !== id &&
        String(r.semesterNumber) !== String(id) &&
        String(r.semesterNumber) !== cleanId &&
        r.id !== `semester-${id}` &&
        r.id !== `res_sem_${id}` &&
        r.id !== `semester-${cleanId}` &&
        r.id !== `res_sem_${cleanId}`
    );
    const normalized = recalculateProgressiveCGPAs(filtered);
    safeSet(STORAGE_KEYS.RESULTS, normalized);
    return true;
  }
};

// Initialize on import
resultService.initialize();
