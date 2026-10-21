import { STORAGE_KEYS } from './storageKeys.js';
import { resultService } from './resultService.js';

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
 * Generate initial seeded audit history for existing semesters if none exists yet
 */
function generateSeedAuditEvents() {
  try {
    const results = resultService.getAllResults();
    if (!Array.isArray(results) || results.length === 0) return [];

    const sorted = [...results].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    return sorted.map((res, index) => {
      // Historical dates spaced realistically
      const baseYear = 2025 + Math.floor((res.semesterNumber - 1) / 2);
      const isOddSem = res.semesterNumber % 2 !== 0;
      const month = isOddSem ? '03' : '09';
      const day = String(10 + (res.semesterNumber * 2)).padStart(2, '0');
      const time = '10:30:00';
      const timestamp = new Date(`${baseYear}-${month}-${day}T${time}.000Z`).toISOString();

      return {
        id: `audit_seed_sem_${res.semesterNumber}_${Date.now() + index}`,
        semesterId: res.id || `semester-${res.semesterNumber}`,
        semesterNumber: Number(res.semesterNumber),
        semesterLabel: res.semesterLabel || res.semesterTitle || `Semester ${res.semesterNumber}`,
        action: 'CREATED',
        timestamp: res.savedAt || timestamp,
        academicPeriod: res.academicPeriod || `Semester ${res.semesterNumber} Term`,
        sgpa: Number(res.sgpa) || 0,
        cgpa: Number(res.cgpa) || 0,
        credits: Number(res.creditsEarned || res.totalCredits) || 0,
        subjectCount: Array.isArray(res.subjects) ? res.subjects.length : (res.subjectCount || 6),
        status: res.status || 'Passed',
        details: `Initial academic record created for Semester ${res.semesterNumber} with SGPA ${Number(res.sgpa).toFixed(2)} and CGPA ${Number(res.cgpa).toFixed(2)}.`,
        actor: 'Student',
      };
    });
  } catch {
    return [];
  }
}

export const auditHistoryService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.AUDIT_HISTORY, null);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      const seeded = generateSeedAuditEvents();
      safeSet(STORAGE_KEYS.AUDIT_HISTORY, seeded);
    }
  },

  getAllAuditEvents() {
    this.initialize();
    return safeGet(STORAGE_KEYS.AUDIT_HISTORY, []);
  },

  recordEvent({
    action,
    semesterNumber,
    semesterLabel,
    resultId,
    academicPeriod,
    sgpa,
    cgpa,
    credits,
    subjectCount,
    status,
    details,
    actor = 'Student',
    entityType = 'result',
    entityId,
    entityName,
    title
  }) {
    const events = this.getAllAuditEvents();
    const semNum = semesterNumber !== undefined ? Number(semesterNumber) : null;
    const computedTitle =
      title ||
      (entityType === 'university'
        ? `${entityName || entityId || 'University'} ${action}`
        : entityType === 'course'
        ? `${entityName || entityId || 'Course'} ${action}`
        : entityType === 'subject'
        ? `${entityName || entityId || 'Subject'} ${action}`
        : entityType === 'grading_scale'
        ? `${entityName || entityId || 'Grading Scale'} ${action}`
        : entityType === 'calculation_rule'
        ? `${entityName || entityId || 'Calculation Rule'} ${action}`
        : semesterLabel
        ? `${semesterLabel} ${action}`
        : `${action}`);

    const newEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: action.toUpperCase(),
      entityType,
      entityId: entityId || resultId || (semNum !== null ? `semester-${semNum}` : null),
      entityName: entityName || null,
      title: computedTitle,
      timestamp: new Date().toISOString(),
      details: details || `${action} performed on ${entityType}.`,
      actor,
      status: status || 'Completed',
      ...(semNum !== null && {
        semesterId: resultId || `semester-${semNum}`,
        semesterNumber: semNum,
        semesterLabel: semesterLabel || `Semester ${semNum}`,
        academicPeriod: academicPeriod || `Semester ${semNum}`,
        sgpa: Number(sgpa) || 0,
        cgpa: Number(cgpa) || 0,
        credits: Number(credits) || 0,
        subjectCount: Number(subjectCount) || 0
      })
    };

    // Prepend new event to keep latest first
    const updatedEvents = [newEvent, ...events];
    safeSet(STORAGE_KEYS.AUDIT_HISTORY, updatedEvents);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_history_updated'));
      window.dispatchEvent(new Event('activity_history_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return newEvent;
  },

  clearAuditHistory() {
    safeSet(STORAGE_KEYS.AUDIT_HISTORY, []);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_history_updated'));
    }
  },

  resetAuditHistory() {
    return this.clearAuditHistory();
  }
};

auditHistoryService.initialize();
