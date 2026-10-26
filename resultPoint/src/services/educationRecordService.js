/**
 * ResultPoint Education Record Service
 * Authoritative management for all student academic qualifications:
 * - Classes 1–9 (School Assessment)
 * - Class 10 (Secondary / High School Board)
 * - Class 12 (Higher Secondary / Intermediate)
 * - Undergraduate (UG) degrees (BCA, B.Tech, B.Sc, B.Com, etc.)
 * - Postgraduate (PG) degrees (MCA, MBA, M.Sc, M.Com, etc.)
 *
 * Supports three UG/PG entry modes:
 * Mode 1: Quick Entry (Completed degrees with final summary)
 * Mode 2: Semester-wise Entry (Progressive semester summaries)
 * Mode 3: Detailed Subject Entry (Subject-level marks/grades with university calculation)
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { authService } from './authService.js';
import { academicCatalogService } from './academicCatalogService.js';
import { activityHistoryService } from './activityHistoryService.js';

// Default initial seed records for demo student user matching the reference UI
const DEFAULT_EDUCATION_RECORDS = [
  {
    id: 'edu_c10_seed',
    type: 'school_10',
    level: 'Class 10',
    category: 'School Education',
    categoryGroup: 'School',
    board: 'CBSE Board',
    schoolName: 'ABC High School, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    passingYear: 2020,
    academicYear: '2019-2020',
    rollNumber: 'CBSE-10-847291',
    status: 'Completed',
    resultStatus: 'Completed',
    totalMarks: 412,
    maxMarks: 500,
    percentage: 82.40,
    finalGrade: 'A1',
    subjects: [
      { id: 'c10_s1', name: 'English Communicative', code: '101', maxMarks: 100, marksObtained: 88, grade: 'A1' },
      { id: 'c10_s2', name: 'Mathematics', code: '041', maxMarks: 100, marksObtained: 82, grade: 'A2' },
      { id: 'c10_s3', name: 'Science', code: '086', maxMarks: 100, marksObtained: 79, grade: 'B1' },
      { id: 'c10_s4', name: 'Social Science', code: '087', maxMarks: 100, marksObtained: 85, grade: 'A2' },
      { id: 'c10_s5', name: 'Hindi Course-A', code: '002', maxMarks: 100, marksObtained: 78, grade: 'B1' }
    ],
    updatedAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'edu_c12_seed',
    type: 'school_12',
    level: 'Class 12',
    category: 'School Education',
    categoryGroup: 'School',
    board: 'CBSE Board',
    schoolName: 'ABC Junior College, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    stream: 'Science (PCM)',
    passingYear: 2022,
    academicYear: '2021-2022',
    rollNumber: 'CBSE-12-920148',
    status: 'Completed',
    resultStatus: 'Completed',
    totalMarks: 441,
    maxMarks: 500,
    percentage: 88.20,
    finalGrade: 'Distinction',
    subjects: [
      { id: 'c12_s1', name: 'English Core', code: '301', maxMarks: 100, marksObtained: 92, grade: 'A1' },
      { id: 'c12_s2', name: 'Mathematics', code: '041', maxMarks: 100, marksObtained: 85, grade: 'A2' },
      { id: 'c12_s3', name: 'Physics', code: '042', maxMarks: 100, marksObtained: 88, grade: 'A1' },
      { id: 'c12_s4', name: 'Chemistry', code: '043', maxMarks: 100, marksObtained: 86, grade: 'A2' },
      { id: 'c12_s5', name: 'Computer Science', code: '083', maxMarks: 100, marksObtained: 90, grade: 'A1' }
    ],
    updatedAt: '2026-01-10T10:05:00.000Z'
  },
  {
    id: 'edu_bca_seed',
    type: 'ug',
    level: 'BCA',
    category: 'Undergraduate',
    categoryGroup: 'Undergraduate',
    universityId: 'osmania',
    university: 'Osmania University (OU)',
    universityShortName: 'OU',
    courseId: 'bca',
    course: 'Bachelor of Computer Applications',
    courseShortName: 'BCA',
    regulationId: 'ou-bca-cbcs',
    regulationName: 'Choice Based Credit System (CBCS)',
    regulationCode: 'CBCS',
    ruleVersion: 'OU_BCA_CBCS_V1',
    batch: '2021-2024',
    admissionYear: 2021,
    completionYear: 2024,
    expectedCompletionYear: 2024,
    durationYears: 3,
    totalSemesters: 6,
    durationText: '6 Semesters (3 Years)',
    status: 'Completed',
    resultStatus: 'Completed',
    isCurrentEducation: false,
    entryMode: 'quick', // 'quick' | 'semester' | 'subject'
    cgpa: 8.12,
    finalGrade: 'First Class with Distinction',
    totalCreditsEarned: 150,
    totalDegreeCredits: 150,
    completedSemesters: 6,
    completedSemestersRatio: '6 / 6',
    semesters: [],
    updatedAt: '2026-01-10T10:10:00.000Z'
  },
  {
    id: 'edu_mca_seed',
    type: 'pg',
    level: 'MCA',
    category: 'Postgraduate',
    categoryGroup: 'Postgraduate',
    universityId: 'osmania',
    university: 'Osmania University (OU)',
    universityShortName: 'OU',
    courseId: 'mca',
    course: 'Master of Computer Applications',
    courseShortName: 'MCA',
    regulationId: 'ou_cbcs_v1',
    regulationName: 'Choice Based Credit System (CBCS)',
    regulationCode: 'CBCS',
    ruleVersion: 'OU_MCA_CBCS_V1',
    batch: '2024-2026',
    admissionYear: 2024,
    expectedCompletionYear: 2026,
    durationYears: 2,
    totalSemesters: 4,
    currentSemester: 3,
    durationText: '4 Semesters (2 Years)',
    status: 'In Progress',
    resultStatus: 'In Progress',
    isCurrentEducation: true,
    entryMode: 'semester',
    cgpa: null,
    totalCreditsEarned: 48,
    totalDegreeCredits: 104,
    completedSemesters: 2,
    completedSemestersRatio: '2 / 4',
    semesters: [
      {
        semesterNumber: 1,
        academicSession: 'Sep 2024 - Jan 2025',
        status: 'COMPLETED',
        sgpa: 8.30,
        creditsEarned: 24,
        totalCredits: 24,
        subjectsCount: 6
      },
      {
        semesterNumber: 2,
        academicSession: 'Feb 2025 - Jun 2025',
        status: 'COMPLETED',
        sgpa: 8.45,
        creditsEarned: 24,
        totalCredits: 24,
        subjectsCount: 6
      },
      {
        semesterNumber: 3,
        academicSession: 'Sep 2025 - Jan 2026',
        status: 'IN_PROGRESS',
        sgpa: null,
        creditsEarned: 0,
        totalCredits: 28,
        subjectsCount: 6
      },
      {
        semesterNumber: 4,
        academicSession: 'Feb 2026 - Jun 2026',
        status: 'NOT_STARTED',
        sgpa: null,
        creditsEarned: 0,
        totalCredits: 28,
        subjectsCount: 2
      }
    ],
    updatedAt: '2026-01-10T10:15:00.000Z'
  }
];

function getRecordsStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.EDUCATION_RECORDS}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (err) {
    console.warn('Error reading auth user for education key:', err);
  }
  return STORAGE_KEYS.EDUCATION_RECORDS;
}

function getActiveContextStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.ACTIVE_EDUCATION_ID}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (err) {
    console.warn('Error reading auth user for active education key:', err);
  }
  return STORAGE_KEYS.ACTIVE_EDUCATION_ID;
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

export const educationRecordService = {
  /**
   * Initializes education records for the authenticated student.
   * Preserves intentional empty records if student deleted all.
   */
  initialize() {
    const key = getRecordsStorageKey();
    const existing = safeGet(key, null);
    if (existing === null) {
      // Seed with default 4 records
      safeSet(key, DEFAULT_EDUCATION_RECORDS);
      const activeKey = getActiveContextStorageKey();
      if (!safeGet(activeKey, null)) {
        safeSet(activeKey, 'edu_mca_seed');
      }
    }
  },

  /**
   * Returns all education records for the authenticated student
   */
  getAll() {
    this.initialize();
    const key = getRecordsStorageKey();
    const records = safeGet(key, []);
    return Array.isArray(records) ? records : [];
  },

  /**
   * Persists authoritative list of records from backend
   */
  saveAll(records) {
    if (!Array.isArray(records)) return;
    const key = getRecordsStorageKey();
    safeSet(key, records);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('education_records_updated'));
    }
  },

  /**
   * Returns a single education record by its ID
   */
  getById(id) {
    if (!id) return null;
    const all = this.getAll();
    return all.find((item) => item.id === id) || null;
  },

  /**
   * Returns the ID of the currently active education context
   */
  getActiveEducationId() {
    const key = getActiveContextStorageKey();
    const storedActive = safeGet(key, null);
    if (storedActive) return storedActive;

    const all = this.getAll();
    const currentUGPG = all.find(
      (r) => (r.type === 'ug' || r.type === 'pg') && (r.status === 'In Progress' || r.status === 'CURRENT' || r.isCurrentEducation)
    );
    if (currentUGPG) return currentUGPG.id;

    const anyUGPG = all.find((r) => r.type === 'ug' || r.type === 'pg');
    return anyUGPG ? anyUGPG.id : null;
  },

  /**
   * Sets the active education context for the authenticated student
   */
  setActiveEducationId(id) {
    const key = getActiveContextStorageKey();
    safeSet(key, id);

    // Also update isCurrentEducation flag in stored records
    const all = this.getAll();
    const updated = all.map((r) => ({
      ...r,
      isCurrentEducation: r.id === id
    }));
    safeSet(getRecordsStorageKey(), updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('active_education_changed'));
      window.dispatchEvent(new Event('education_records_updated'));
    }

    const selected = updated.find((r) => r.id === id);
    if (selected) {
      try {
        activityHistoryService.recordActivity({
          type: 'education',
          action: 'active_context_changed',
          title: `Active Academic Context: ${selected.level}`,
          description: `Switched active education context to ${selected.level} (${selected.university || selected.schoolName || ''})`,
          entityId: selected.id,
          badgeValues: [selected.category || 'Education', 'Context'],
          resultMetric: { label: 'Active', value: selected.level, color: 'blue' }
        });
      } catch (e) {
        console.warn('Activity history education log warning:', e);
      }
    }

    return selected || null;
  },

  /**
   * Adds a new education record
   */
  add(recordData) {
    this.initialize();
    const key = getRecordsStorageKey();
    const existing = this.getAll();

    const newId = recordData.id || `edu_${Date.now()}`;
    const normalized = this.normalizeEducationRecord({
      ...recordData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const updatedList = [normalized, ...existing];
    safeSet(key, updatedList);

    // If it's the only UG/PG or marked as current, make it active
    if (normalized.isCurrentEducation || (!this.getActiveEducationId() && (normalized.type === 'ug' || normalized.type === 'pg'))) {
      this.setActiveEducationId(normalized.id);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('education_records_updated'));
    }

    try {
      activityHistoryService.recordActivity({
        type: 'education',
        action: 'added',
        title: `Added Education Record: ${normalized.level}`,
        description: `Added ${normalized.level} record under ${normalized.category} (${normalized.university || normalized.schoolName || normalized.board})`,
        entityId: normalized.id,
        badgeValues: [normalized.category || 'Education', normalized.status || 'Added'],
        resultMetric: {
          label: normalized.percentage ? 'Score' : 'CGPA',
          value: normalized.percentage ? `${normalized.percentage}%` : (normalized.cgpa ? Number(normalized.cgpa).toFixed(2) : '-'),
          color: 'orange'
        }
      });
    } catch (e) {
      console.warn('Activity log warning on add education:', e);
    }

    return normalized;
  },

  /**
   * Updates an existing education record
   */
  update(id, updates) {
    if (!id) throw new Error('Education ID required for update');
    const key = getRecordsStorageKey();
    const existing = this.getAll();
    const index = existing.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Education record with ID ${id} not found`);
    }

    const current = existing[index];
    const merged = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
      createdAt: current.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const normalized = this.normalizeEducationRecord(merged);
    existing[index] = normalized;
    safeSet(key, existing);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('education_records_updated'));
    }

    try {
      activityHistoryService.recordActivity({
        type: 'education',
        action: 'updated',
        title: `Updated Education Record: ${normalized.level}`,
        description: `Modified details for ${normalized.level} (${normalized.category})`,
        entityId: normalized.id,
        badgeValues: [normalized.category || 'Education', 'Updated'],
        resultMetric: {
          label: normalized.percentage ? 'Score' : 'CGPA',
          value: normalized.percentage ? `${normalized.percentage}%` : (normalized.cgpa ? Number(normalized.cgpa).toFixed(2) : '-'),
          color: 'blue'
        }
      });
    } catch (e) {
      console.warn('Activity log warning on update education:', e);
    }

    return normalized;
  },

  /**
   * Deletes an education record with scoped safety
   */
  delete(id) {
    if (!id) throw new Error('Education ID required for deletion');
    const key = getRecordsStorageKey();
    const existing = this.getAll();
    const target = existing.find((r) => r.id === id);

    if (!target) {
      return false;
    }

    const filtered = existing.filter((r) => r.id !== id);
    safeSet(key, filtered);

    // If active education was deleted, reassign active to remaining UG/PG
    const activeId = this.getActiveEducationId();
    if (activeId === id) {
      const remainingUGPG = filtered.find((r) => r.type === 'ug' || r.type === 'pg');
      safeSet(getActiveContextStorageKey(), remainingUGPG ? remainingUGPG.id : null);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('education_records_updated'));
      window.dispatchEvent(new Event('active_education_changed'));
    }

    try {
      activityHistoryService.recordActivity({
        type: 'education',
        action: 'deleted',
        title: `Deleted Education Record: ${target.level}`,
        description: `Removed ${target.level} (${target.category}) from academic profile`,
        entityId: target.id,
        badgeValues: [target.category || 'Education', 'Deleted'],
        resultMetric: { label: 'Status', value: 'Deleted', color: 'pink' }
      });
    } catch (e) {
      console.warn('Activity log warning on delete education:', e);
    }

    return true;
  },

  /**
   * Upgrades a UG/PG education record's entry mode (e.g. from quick to semester or subject)
   * Preserves existing values without duplication
   */
  upgradeEntryMode(id, newMode, newModeData = {}) {
    const record = this.getById(id);
    if (!record) throw new Error('Education record not found');

    const updates = {
      ...newModeData,
      entryMode: newMode
    };

    return this.update(id, updates);
  },

  /**
   * Calculates automatic timeline suggestion based on catalog metadata
   */
  generateAcademicTimeline(admissionYear, courseId, universityId) {
    const admYear = Number(admissionYear) || new Date().getFullYear();
    let totalSemesters = 6;
    let durationYears = 3;

    if (universityId && courseId) {
      const course = academicCatalogService.getCourse(universityId, courseId);
      if (course) {
        totalSemesters = Number(course.totalSemesters) || 6;
        durationYears = Number(course.durationYears) || Math.round(totalSemesters / 2);
      }
    }

    const expectedCompletionYear = admYear + durationYears;

    const semesters = [];
    for (let i = 1; i <= totalSemesters; i++) {
      const yearOffset = Math.floor((i - 1) / 2);
      const isOdd = i % 2 !== 0;
      const semStartYear = admYear + yearOffset;
      const session = isOdd
        ? `Sep ${semStartYear} - Jan ${semStartYear + 1}`
        : `Feb ${semStartYear + 1} - Jun ${semStartYear + 1}`;

      semesters.push({
        semesterNumber: i,
        academicSession: session,
        status: i === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
        sgpa: null,
        creditsEarned: 0,
        totalCredits: 24,
        subjectsCount: 0
      });
    }

    return {
      durationYears,
      totalSemesters,
      durationText: `${totalSemesters} Semesters (${durationYears} Years)`,
      expectedCompletionYear,
      semesters
    };
  },

  /**
   * Normalizes fields and computes derived values consistently
   */
  normalizeEducationRecord(raw) {
    const isSchool = raw.type === 'school_early' || raw.type === 'school_10' || raw.type === 'school_12';
    const isUG = raw.type === 'ug';
    const isPG = raw.type === 'pg';

    let category = raw.category;
    let categoryGroup = raw.categoryGroup;

    if (isSchool) {
      category = 'School Education';
      categoryGroup = 'School';
    } else if (isUG) {
      category = 'Undergraduate';
      categoryGroup = 'Undergraduate';
    } else if (isPG) {
      category = 'Postgraduate';
      categoryGroup = 'Postgraduate';
    }

    // Determine completion status
    const isCompleted =
      raw.status === 'Completed' ||
      raw.status === 'COMPLETED' ||
      raw.resultStatus === 'Completed';

    const normalizedStatus = isCompleted ? 'Completed' : 'In Progress';

    // Calculate School summary if subjects provided
    let calculatedPercentage = raw.percentage;
    let calculatedTotalMarks = raw.totalMarks;
    let calculatedMaxMarks = raw.maxMarks;

    if (isSchool && Array.isArray(raw.subjects) && raw.subjects.length > 0) {
      const validSubjects = raw.subjects.filter((s) => typeof s.marksObtained === 'number' && typeof s.maxMarks === 'number');
      if (validSubjects.length > 0) {
        calculatedTotalMarks = validSubjects.reduce((sum, s) => sum + Number(s.marksObtained || 0), 0);
        calculatedMaxMarks = validSubjects.reduce((sum, s) => sum + Number(s.maxMarks || 0), 0);
        if (calculatedMaxMarks > 0) {
          calculatedPercentage = Number(((calculatedTotalMarks / calculatedMaxMarks) * 100).toFixed(2));
        }
      }
    }

    // Determine UG/PG completed semesters ratio
    let completedCount = 0;
    const totalSems = Number(raw.totalSemesters) || (isPG ? 4 : 6);

    if (isCompleted) {
      completedCount = totalSems;
    } else if (Array.isArray(raw.semesters) && raw.semesters.length > 0) {
      completedCount = raw.semesters.filter(
        (s) => s.status === 'COMPLETED' || (s.sgpa !== null && s.sgpa !== undefined && Number(s.sgpa) > 0)
      ).length;
    } else if (typeof raw.completedSemesters === 'number') {
      completedCount = raw.completedSemesters;
    }

    const completedSemestersRatio = `${completedCount} / ${totalSems}`;

    // Compute duration text
    const durationYears = Number(raw.durationYears) || Math.round(totalSems / 2);
    const durationText = raw.durationText || `${totalSems} Semesters (${durationYears} Years)`;

    return {
      ...raw,
      category,
      categoryGroup,
      status: normalizedStatus,
      resultStatus: normalizedStatus,
      totalSemesters: totalSems,
      durationYears,
      durationText,
      completedSemesters: completedCount,
      completedSemestersRatio,
      totalMarks: calculatedTotalMarks,
      maxMarks: calculatedMaxMarks,
      percentage: calculatedPercentage,
      cgpa: raw.cgpa !== undefined && raw.cgpa !== null && raw.cgpa !== '' ? raw.cgpa : (isCompleted ? 8.00 : null)
    };
  }
};
