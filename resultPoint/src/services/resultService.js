import { STORAGE_KEYS } from './storageKeys.js';
import { academicCalculationEngine } from './academicCalculationEngine.js';
import { auditHistoryService } from './auditHistoryService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { notificationService } from './notificationService.js';


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

/**
 * Automatically synchronizes student's current active semester when results are added, edited, or deleted
 */
function syncStudentActiveSemester(normalizedResults) {
  try {
    if (typeof localStorage === 'undefined') return;
    const rawStudent = localStorage.getItem(STORAGE_KEYS.STUDENT);
    if (!rawStudent) return;
    const student = JSON.parse(rawStudent);
    const maxSem = Number(student.totalSemesters) || 6;
    const validResults = (normalizedResults || []).filter(
      (r) => r && Number(r.semesterNumber) >= 1 && Number(r.semesterNumber) <= maxSem
    );
    const completedSet = new Set(validResults.map((r) => Number(r.semesterNumber)));
    let lowestMissing = null;
    for (let s = 1; s <= maxSem; s++) {
      if (!completedSet.has(s)) {
        lowestMissing = s;
        break;
      }
    }
    const isDegreeCompleted = completedSet.size >= maxSem && lowestMissing === null;
    const nextActive = isDegreeCompleted ? maxSem : (lowestMissing || 1);

    if (student.currentSemester !== nextActive) {
      student.currentSemester = nextActive;
      localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(student));

      // Also update auth user session if present
      const rawAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (rawAuth) {
        const auth = JSON.parse(rawAuth);
        if (auth && auth.user) {
          auth.user.currentSemester = nextActive;
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('academic_profile_updated'));
      }
    }
  } catch (err) {
    console.warn('Could not sync student active semester:', err);
  }
}

export const resultService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.RESULTS, null);
    if (existing === null) {
      safeSet(STORAGE_KEYS.RESULTS, DEFAULT_RESULTS);
    } else if (Array.isArray(existing) && existing.length > 0) {
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
    return safeGet(STORAGE_KEYS.RESULTS, []);
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
    const semNum = Number(newResult.semesterNumber) || (results.length + 1);

    // Prevent duplicate semester entries
    const existingIndex = results.findIndex(
      (r) => Number(r.semesterNumber) === semNum || r.id === newResult.id
    );
    if (existingIndex !== -1) {
      throw new Error(`Semester ${semNum} has already been saved.`);
    }

    const resultToSave = {
      id: newResult.id || `semester-${semNum}`,
      semesterNumber: semNum,
      semesterTitle: newResult.semesterTitle || `Semester ${semNum}`,
      semesterLabel: newResult.semesterLabel || `Semester ${semNum}`,
      academicPeriod: newResult.academicPeriod || `Semester ${semNum} Exam`,
      sgpa: Number(newResult.sgpa) || 0,
      cgpa: Number(newResult.cgpa) || Number(newResult.sgpa) || 0,
      creditsEarned: Number(newResult.creditsEarned) || 0,
      totalCredits: Number(newResult.totalCredits) || 0,
      subjectCount: (newResult.subjects && newResult.subjects.length) || Number(newResult.subjectCount) || 0,
      status: newResult.status || 'Passed',
      badgeColor: newResult.badgeColor || (Number(newResult.sgpa) >= 8.5 ? 'purple' : Number(newResult.sgpa) >= 7.5 ? 'blue' : 'emerald'),
      subjects: newResult.subjects || [],
      universityId: newResult.universityId,
      courseId: newResult.courseId,
      regulationId: newResult.regulationId,
      ruleVersion: newResult.ruleVersion,
      academicBatch: newResult.academicBatch,
      savedAt: new Date().toISOString()
    };

    const combined = [...results, resultToSave];
    const normalized = recalculateProgressiveCGPAs(combined);
    safeSet(STORAGE_KEYS.RESULTS, normalized);
    syncStudentActiveSemester(normalized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('results_data_updated'));
    }
    const saved = normalized.find((r) => r.id === resultToSave.id || Number(r.semesterNumber) === semNum) || resultToSave;
    try {
      auditHistoryService.recordEvent({
        action: 'CREATED',
        semesterNumber: saved.semesterNumber,
        semesterLabel: saved.semesterLabel,
        resultId: saved.id,
        academicPeriod: saved.academicPeriod,
        sgpa: saved.sgpa,
        cgpa: saved.cgpa,
        credits: saved.creditsEarned || saved.totalCredits,
        subjectCount: saved.subjects?.length || saved.subjectCount,
        status: saved.status,
        details: `Saved result for Semester ${saved.semesterNumber} with SGPA: ${Number(saved.sgpa).toFixed(2)}, CGPA: ${Number(saved.cgpa).toFixed(2)}.`
      });

      activityHistoryService.recordActivity({
        type: 'result',
        action: 'created',
        title: 'Added Semester Result',
        description: `Added Semester ${saved.semesterNumber} results (${saved.courseId?.toUpperCase() || 'BCA'})`,
        entityId: saved.id,
        badgeValues: [`Semester ${saved.semesterNumber}`, saved.courseId?.toUpperCase() || 'BCA', `${saved.subjects?.length || saved.subjectCount || 6} Subjects`],
        resultMetric: { label: 'SGPA', value: Number(saved.sgpa).toFixed(2), color: 'emerald' },
        metadata: {
          activityType: 'Result Creation',
          course: saved.courseId?.toUpperCase() || 'BCA',
          semester: `Semester ${saved.semesterNumber}`,
          semesterNumber: saved.semesterNumber,
          totalSubjects: saved.subjects?.length || saved.subjectCount || 6,
          sgpa: Number(saved.sgpa).toFixed(2),
          cgpa: Number(saved.cgpa).toFixed(2),
          creditsEarned: saved.creditsEarned,
          status: saved.status,
          remarks: 'Initial semester result recorded.'
        }
      });

      notificationService.notifyResultSaved(saved.semesterNumber, saved.sgpa);
    } catch (e) {
      console.warn('Audit/Activity/Notification record warning:', e);
    }
    return saved;
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
      const previousSem = results[index];
      let fieldsToApply = { ...updatedFields };

      // If subjects are passed but sgpa or creditsEarned not specified, calculate them automatically
      if (fieldsToApply.subjects && Array.isArray(fieldsToApply.subjects)) {
        const calc = academicCalculationEngine.calculateSGPA(fieldsToApply.subjects);
        if (fieldsToApply.sgpa === undefined) fieldsToApply.sgpa = calc.sgpa;
        if (fieldsToApply.creditsEarned === undefined) fieldsToApply.creditsEarned = calc.earnedCredits;
        if (fieldsToApply.totalCredits === undefined) fieldsToApply.totalCredits = calc.totalCredits;
        if (!fieldsToApply.status || fieldsToApply.status === 'Failed' || fieldsToApply.status === 'Passed') {
          fieldsToApply.status = calc.status;
        }
      }

      results[index] = { ...results[index], ...fieldsToApply };
      const normalized = recalculateProgressiveCGPAs(results);
      safeSet(STORAGE_KEYS.RESULTS, normalized);
      syncStudentActiveSemester(normalized);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('results_data_updated'));
      }
      const saved = normalized[index];
      try {
        auditHistoryService.recordEvent({
          action: 'UPDATED',
          semesterNumber: saved.semesterNumber,
          semesterLabel: saved.semesterLabel,
          resultId: saved.id,
          academicPeriod: saved.academicPeriod,
          sgpa: saved.sgpa,
          cgpa: saved.cgpa,
          credits: saved.creditsEarned || saved.totalCredits,
          subjectCount: saved.subjects?.length || saved.subjectCount,
          status: saved.status,
          details: `Updated Semester ${saved.semesterNumber} result details. New SGPA: ${Number(saved.sgpa).toFixed(2)}, CGPA: ${Number(saved.cgpa).toFixed(2)}.`
        });

        // Compute subject changes
        let subjectChanges = [];
        if (Array.isArray(updatedFields.subjects) && Array.isArray(previousSem.subjects)) {
          subjectChanges = updatedFields.subjects.map((sub) => {
            const prev = previousSem.subjects.find((p) => p.code === sub.code || p.name === sub.name);
            return {
              subject: sub.code || sub.name,
              name: sub.name,
              previousGrade: prev?.grade || '-',
              updatedGrade: sub.grade
            };
          }).filter((c) => c.previousGrade !== c.updatedGrade);
        }

        activityHistoryService.recordActivity({
          type: 'result',
          action: 'updated',
          title: 'Edited Semester Result',
          description: `Updated Semester ${saved.semesterNumber} results (${saved.courseId?.toUpperCase() || 'BCA'})`,
          entityId: saved.id,
          badgeValues: [`Semester ${saved.semesterNumber}`, saved.courseId?.toUpperCase() || 'BCA', `${saved.subjects?.length || saved.subjectCount || 6} Subjects`],
          resultMetric: { label: 'SGPA', value: Number(saved.sgpa).toFixed(2), color: 'emerald' },
          metadata: {
            activityType: 'Result Update',
            course: saved.courseId?.toUpperCase() || 'BCA',
            semester: `Semester ${saved.semesterNumber}`,
            semesterNumber: saved.semesterNumber,
            totalSubjects: saved.subjects?.length || saved.subjectCount || 6,
            previousSGPA: Number(previousSem.sgpa).toFixed(2),
            updatedSGPA: Number(saved.sgpa).toFixed(2),
            previousCGPA: Number(previousSem.cgpa).toFixed(2),
            updatedCGPA: Number(saved.cgpa).toFixed(2),
            subjectChanges,
            remarks: 'Updated semester marks and grading standing.'
          }
        });

        notificationService.notifyResultUpdated(saved.semesterNumber, saved.sgpa);
      } catch (e) {
        console.warn('Audit/Activity/Notification record warning:', e);
      }
      return saved;
    }
    return null;
  },

  deleteResult(id) {
    const results = this.getAllResults();
    const cleanId = String(id).replace('semester-', '').replace('res_sem_', '');
    const targetSem = results.find(
      (r) =>
        r.id === id ||
        String(r.semesterNumber) === String(id) ||
        String(r.semesterNumber) === cleanId
    );
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
    syncStudentActiveSemester(normalized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('results_data_updated'));
    }
    try {
      auditHistoryService.recordEvent({
        action: 'DELETED',
        semesterNumber: targetSem ? targetSem.semesterNumber : cleanId,
        semesterLabel: targetSem ? targetSem.semesterLabel : `Semester ${cleanId}`,
        resultId: id,
        details: `Deleted academic result record for Semester ${targetSem ? targetSem.semesterNumber : cleanId}.`
      });

      activityHistoryService.recordActivity({
        type: 'result',
        action: 'deleted',
        title: 'Deleted Semester Result',
        description: `Removed Semester ${targetSem?.semesterNumber || cleanId} result record`,
        entityId: id,
        badgeValues: [`Semester ${targetSem?.semesterNumber || cleanId}`, 'Removed'],
        resultMetric: { label: 'Status', value: 'Deleted', color: 'rose' },
        metadata: {
          activityType: 'Result Deletion',
          semesterNumber: targetSem?.semesterNumber || cleanId,
          remarks: 'Academic semester result removed from curriculum records.'
        }
      });
    } catch (e) {
      console.warn('Audit/Activity record warning:', e);
    }
    return true;
  },

  resetResults(newResults = []) {
    safeSet(STORAGE_KEYS.RESULTS, newResults);
    syncStudentActiveSemester(newResults);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('results_data_updated'));
    }
    return newResults;
  }
};

// Initialize on import
resultService.initialize();
