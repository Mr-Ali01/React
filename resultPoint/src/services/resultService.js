import { STORAGE_KEYS } from './storageKeys';

// Default semester results matching the reference image exactly
const DEFAULT_RESULTS = [
  {
    id: 'res_sem_1',
    semesterNumber: 1,
    semesterTitle: 'Semester 1',
    academicPeriod: 'Mar 2025',
    sgpa: 7.68,
    cgpa: 7.68,
    creditsEarned: 21,
    totalCredits: 21,
    status: 'Passed',
    badgeColor: 'orange',
    subjects: [
      { code: 'CS101', name: 'Programming in C', credits: 4, grade: 'A', points: 8 },
      { code: 'CS102', name: 'Discrete Mathematics', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS103', name: 'Digital Logic & Architecture', credits: 4, grade: 'A', points: 8 },
      { code: 'CS104', name: 'Web Fundamentals', credits: 3, grade: 'A+', points: 9 },
      { code: 'CS105', name: 'Software Engineering', credits: 3, grade: 'B', points: 6 },
      { code: 'CS106', name: 'Programming Lab', credits: 3, grade: 'A+', points: 9 }
    ]
  },
  {
    id: 'res_sem_2',
    semesterNumber: 2,
    semesterTitle: 'Semester 2',
    academicPeriod: 'Sep 2025',
    sgpa: 8.10,
    cgpa: 7.89,
    creditsEarned: 21,
    totalCredits: 21,
    status: 'Passed',
    badgeColor: 'emerald',
    subjects: [
      { code: 'CS201', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS202', name: 'Database Management Systems', credits: 4, grade: 'A', points: 8 },
      { code: 'CS203', name: 'Computer Networks', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS204', name: 'Operating Systems', credits: 3, grade: 'A', points: 8 },
      { code: 'CS205', name: 'Probability & Statistics', credits: 3, grade: 'B+', points: 7 },
      { code: 'CS206', name: 'DBMS & DS Lab', credits: 3, grade: 'O', points: 10 }
    ]
  },
  {
    id: 'res_sem_3',
    semesterNumber: 3,
    semesterTitle: 'Semester 3',
    academicPeriod: 'Mar 2026',
    sgpa: 8.45,
    cgpa: 8.10,
    creditsEarned: 22,
    totalCredits: 22,
    status: 'Passed',
    badgeColor: 'blue',
    subjects: [
      { code: 'CS301', name: 'Object Oriented Software Dev', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS302', name: 'Design & Analysis of Algorithms', credits: 4, grade: 'A', points: 8 },
      { code: 'CS303', name: 'Theory of Computation', credits: 4, grade: 'B+', points: 7 },
      { code: 'CS304', name: 'Cloud Computing & DevOps', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS305', name: 'Full Stack Web Dev', credits: 3, grade: 'O', points: 10 },
      { code: 'CS306', name: 'Algorithm Lab', credits: 3, grade: 'A+', points: 9 }
    ]
  },
  {
    id: 'res_sem_4',
    semesterNumber: 4,
    semesterTitle: 'Semester 4',
    academicPeriod: 'Sep 2026',
    sgpa: 8.72,
    cgpa: 8.37,
    creditsEarned: 22,
    totalCredits: 22,
    status: 'Passed',
    badgeColor: 'purple',
    subjects: [
      { code: 'CS401', name: 'Machine Learning & AI', credits: 4, grade: 'O', points: 10 },
      { code: 'CS402', name: 'Information Security', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS403', name: 'Big Data Analytics', credits: 4, grade: 'A', points: 8 },
      { code: 'CS404', name: 'Mobile Application Dev', credits: 4, grade: 'A+', points: 9 },
      { code: 'CS405', name: 'Distributed Systems', credits: 3, grade: 'A', points: 8 },
      { code: 'CS406', name: 'AI & Security Lab', credits: 3, grade: 'O', points: 10 }
    ]
  }
];

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

export const resultService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.RESULTS, null);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      safeSet(STORAGE_KEYS.RESULTS, DEFAULT_RESULTS);
    }
  },

  getAllResults() {
    this.initialize();
    return safeGet(STORAGE_KEYS.RESULTS, DEFAULT_RESULTS);
  },

  getRecentResults(limit = 4) {
    const results = this.getAllResults();
    // Sort descending by semesterNumber (S4, S3, S2, S1)
    return [...results].sort((a, b) => b.semesterNumber - a.semesterNumber).slice(0, limit);
  },

  getResultById(id) {
    const results = this.getAllResults();
    return results.find((r) => r.id === id) || null;
  },

  addResult(newResult) {
    const results = this.getAllResults();
    const resultToSave = {
      id: newResult.id || `res_sem_${Date.now()}`,
      semesterNumber: Number(newResult.semesterNumber) || results.length + 1,
      semesterTitle: newResult.semesterTitle || `Semester ${results.length + 1}`,
      academicPeriod: newResult.academicPeriod || 'Current Period',
      sgpa: Number(newResult.sgpa) || 0,
      cgpa: Number(newResult.cgpa) || Number(newResult.sgpa) || 0,
      creditsEarned: Number(newResult.creditsEarned) || 20,
      totalCredits: Number(newResult.totalCredits) || 20,
      status: newResult.status || 'Passed',
      badgeColor: newResult.badgeColor || 'blue',
      subjects: newResult.subjects || []
    };

    results.push(resultToSave);
    safeSet(STORAGE_KEYS.RESULTS, results);
    return resultToSave;
  },

  updateResult(id, updatedFields) {
    const results = this.getAllResults();
    const index = results.findIndex((r) => r.id === id);
    if (index !== -1) {
      results[index] = { ...results[index], ...updatedFields };
      safeSet(STORAGE_KEYS.RESULTS, results);
      return results[index];
    }
    return null;
  },

  deleteResult(id) {
    const results = this.getAllResults();
    const filtered = results.filter((r) => r.id !== id);
    safeSet(STORAGE_KEYS.RESULTS, filtered);
    return true;
  }
};

// Initialize on import
resultService.initialize();
