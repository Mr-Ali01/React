import { STORAGE_KEYS } from './storageKeys.js';
import { resultService } from './resultService.js';
import { academicCalculationEngine } from './academicCalculationEngine.js';
import { academicCatalogService } from './academicCatalogService.js';
import { studentService } from './studentService.js';
import { auditHistoryService } from './auditHistoryService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { notificationService } from './notificationService.js';

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

export function isSubjectFailed(sub) {
  if (!sub) return false;
  const grade = String(sub.grade || '').trim().toUpperCase();
  return (
    sub.isPass === false ||
    grade === 'F' ||
    grade === 'FAIL' ||
    grade === 'AB' ||
    grade === 'ABSENT' ||
    sub.isBacklog === true ||
    (Number(sub.points) === 0 && grade !== 'P' && grade !== 'C' && grade !== 'PASS')
  );
}

export const backlogService = {
  getGradePoints(grade, univId, courseId, regId) {
    if (!grade) return 0;
    const cleanGrade = String(grade).trim().toUpperCase();

    // Check catalog configuration for the student
    try {
      const profile = studentService.getProfile() || {};
      const config = academicCatalogService.getFullConfiguration(
        univId || profile.universityId,
        courseId || profile.courseId,
        regId || profile.regulationId
      );
      if (config && Array.isArray(config.gradeScale)) {
        const found = config.gradeScale.find((g) => g.grade.toUpperCase() === cleanGrade);
        if (found && typeof found.points === 'number') {
          return found.points;
        }
      }
    } catch {
      // Fallback below
    }

    // Standard scale fallback
    const fallbackMap = {
      S: 10,
      O: 10,
      'A+': 9,
      A: 8,
      'B+': 7,
      B: 6,
      C: 5,
      P: 4,
      F: 0
    };
    return fallbackMap[cleanGrade] ?? 0;
  },

  scanBacklogs(customResults) {
    const results = customResults || resultService.getAllResults();
    const storedBacklogs = safeGet(STORAGE_KEYS.BACKLOGS, []);

    if (!Array.isArray(results) || results.length === 0) {
      return {
        backlogs: [],
        totalBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        clearanceRate: 100,
        clearanceStatus: 'All Clear'
      };
    }

    // Sort ascending by semesterNumber
    const sorted = [...results].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    const validSemesterNumbers = new Set(sorted.map((s) => Number(s.semesterNumber)));

    // Retain existing backlog map seeded with stored backlogs
    const backlogMap = new Map();

    // Seed with stored backlogs whose semester still exists in results
    storedBacklogs.forEach((item) => {
      if (item && validSemesterNumbers.has(Number(item.semesterNumber))) {
        const code = (item.subjectCode || '').trim().toUpperCase();
        const key = `${code}_sem_${item.semesterNumber}`;
        backlogMap.set(key, { ...item });
      }
    });

    // Scan current results
    sorted.forEach((sem) => {
      const semNum = Number(sem.semesterNumber);
      (sem.subjects || []).forEach((sub) => {
        const subCode = (sub.code || sub.name || '').trim().toUpperCase();
        const key = `${subCode}_sem_${semNum}`;
        const failed = isSubjectFailed(sub);

        if (failed) {
          const existing = backlogMap.get(key);
          const origGrade = existing?.originalGrade || sub.grade || 'F';
          backlogMap.set(key, {
            id: `backlog_${subCode}_s${semNum}`,
            subjectCode: sub.code || subCode,
            subjectName: sub.name || subCode,
            semesterNumber: semNum,
            semesterLabel: sem.semesterLabel || sem.semesterTitle || `Semester ${semNum}`,
            academicPeriod: sem.academicPeriod || `Semester ${semNum} Exam`,
            credits: Number(sub.credits) || 4,
            grade: origGrade,
            originalGrade: origGrade,
            points: Number(sub.points) || 0,
            marksObtained: Number(sub.marksObtained) || 0,
            maxMarks: Number(sub.maxMarks) || 100,
            status: 'Active',
            clearedInSemester: null,
            clearedPeriod: null,
            clearedGrade: null,
            clearedPoints: null,
            clearedAt: null,
            attemptDate: sem.academicPeriod || 'Initial Examination',
            recordedAt: existing?.recordedAt || new Date().toISOString()
          });
        } else {
          // Subject is passed
          const existing = backlogMap.get(key);
          if (existing) {
            // If it was previously tracked as a backlog or has backlog flags, mark as Cleared
            if (existing.status === 'Active' || sub.wasBacklog) {
              const origGrade = sub.originalGrade || existing.originalGrade || existing.grade || 'F';
              backlogMap.set(key, {
                ...existing,
                status: 'Cleared',
                grade: origGrade,
                originalGrade: origGrade,
                clearedInSemester: semNum,
                clearedPeriod: sub.clearedPeriod || existing.clearedPeriod || 'Supplementary Examination',
                clearedGrade: sub.clearedGrade || sub.grade,
                clearedPoints: sub.clearedPoints ?? sub.points,
                clearedAt: sub.clearedAt || existing.clearedAt || new Date().toISOString()
              });
            }
          }

          // Also check if this subject clears earlier semester backlogs for the same course code
          backlogMap.forEach((entry, entryKey) => {
            if (
              entry.subjectCode.toUpperCase() === subCode &&
              entry.semesterNumber < semNum &&
              entry.status === 'Active'
            ) {
              backlogMap.set(entryKey, {
                ...entry,
                status: 'Cleared',
                clearedInSemester: semNum,
                clearedPeriod: sem.academicPeriod || `Semester ${semNum} Exam`,
                clearedGrade: sub.grade,
                clearedPoints: sub.points,
                clearedAt: sem.savedAt || new Date().toISOString()
              });
            }
          });
        }
      });
    });

    const backlogs = Array.from(backlogMap.values());
    const totalBacklogs = backlogs.length;
    const activeBacklogs = backlogs.filter((b) => b.status === 'Active').length;
    const clearedBacklogs = backlogs.filter((b) => b.status === 'Cleared').length;
    const clearanceRate = totalBacklogs > 0 ? Math.round((clearedBacklogs / totalBacklogs) * 100) : 100;
    const clearanceStatus = activeBacklogs === 0 ? 'All Clear' : `${activeBacklogs} Active`;

    // Persist updated backlogs
    safeSet(STORAGE_KEYS.BACKLOGS, backlogs);

    return {
      backlogs,
      totalBacklogs,
      activeBacklogs,
      clearedBacklogs,
      clearanceRate,
      clearanceStatus
    };
  },

  clearBacklog({
    semesterId,
    semesterNumber,
    subjectCode,
    clearedGrade = 'C',
    clearedPoints,
    clearedPeriod
  }) {
    const results = resultService.getAllResults();
    const cleanId = String(semesterId || semesterNumber || '')
      .replace('semester-', '')
      .replace('res_sem_', '');

    const sem = results.find(
      (r) =>
        r.id === semesterId ||
        String(r.semesterNumber) === String(semesterNumber) ||
        String(r.semesterNumber) === cleanId ||
        r.id === `semester-${cleanId}`
    );

    if (!sem) {
      throw new Error(`Semester result record not found for id: ${semesterId || semesterNumber}`);
    }

    const cleanCode = (subjectCode || '').trim().toUpperCase();
    const subIndex = (sem.subjects || []).findIndex(
      (s) =>
        (s.code && s.code.trim().toUpperCase() === cleanCode) ||
        (s.name && s.name.trim().toUpperCase() === cleanCode)
    );

    if (subIndex === -1) {
      throw new Error(`Subject with code ${subjectCode} not found in Semester ${sem.semesterNumber}`);
    }

    const targetSub = sem.subjects[subIndex];
    const finalGrade = (clearedGrade || 'C').toUpperCase();
    const finalPoints =
      clearedPoints !== undefined && clearedPoints !== null
        ? Number(clearedPoints)
        : this.getGradePoints(finalGrade);

    const origGrade = targetSub.originalGrade || targetSub.grade || 'F';
    const period = clearedPeriod || 'Supplementary Examination';
    const nowIso = new Date().toISOString();

    const updatedSub = {
      ...targetSub,
      grade: finalGrade,
      points: finalPoints,
      isPass: true,
      wasBacklog: true,
      originalGrade: origGrade,
      clearedGrade: finalGrade,
      clearedPoints: finalPoints,
      clearedPeriod: period,
      clearedAt: nowIso,
      isBacklog: false,
      attemptCount: (targetSub.attemptCount || 1) + 1
    };

    const updatedSubjects = [...sem.subjects];
    updatedSubjects[subIndex] = updatedSub;

    // Recalculate SGPA and Credits using academicCalculationEngine
    let gradeScale = [];
    try {
      const profile = studentService.getProfile();
      const config = academicCatalogService.getFullConfiguration(
        profile.universityId,
        profile.courseId,
        profile.regulationId
      );
      if (config && Array.isArray(config.gradeScale)) {
        gradeScale = config.gradeScale;
      }
    } catch {
      // fallback
    }

    const calc = academicCalculationEngine.calculateSGPA(updatedSubjects, gradeScale);

    // Update semester result in resultService (this recomputes progressive CGPAs, audits, and broadcasts results_data_updated)
    const updatedSem = resultService.updateResult(sem.id, {
      subjects: updatedSubjects,
      sgpa: calc.sgpa,
      creditsEarned: calc.earnedCredits,
      status: calc.status
    });

    // Update backlog record in STORAGE_KEYS.BACKLOGS
    const storedBacklogs = safeGet(STORAGE_KEYS.BACKLOGS, []);
    const backlogKey = `backlog_${cleanCode}_s${sem.semesterNumber}`;
    const existingIndex = storedBacklogs.findIndex(
      (b) =>
        b.id === backlogKey ||
        (b.subjectCode.toUpperCase() === cleanCode && Number(b.semesterNumber) === Number(sem.semesterNumber))
    );

    const clearedBacklogRecord = {
      id: backlogKey,
      subjectCode: targetSub.code || subjectCode,
      subjectName: targetSub.name || targetSub.code || subjectCode,
      semesterNumber: Number(sem.semesterNumber),
      semesterLabel: sem.semesterLabel || `Semester ${sem.semesterNumber}`,
      academicPeriod: sem.academicPeriod || `Semester ${sem.semesterNumber} Exam`,
      credits: Number(targetSub.credits) || 4,
      grade: origGrade,
      originalGrade: origGrade,
      points: targetSub.points || 0,
      status: 'Cleared',
      clearedInSemester: Number(sem.semesterNumber),
      clearedPeriod: period,
      clearedGrade: finalGrade,
      clearedPoints: finalPoints,
      clearedAt: nowIso,
      attemptDate: sem.academicPeriod || 'Initial Examination',
      recordedAt: existingIndex !== -1 ? storedBacklogs[existingIndex].recordedAt : nowIso
    };

    if (existingIndex !== -1) {
      storedBacklogs[existingIndex] = { ...storedBacklogs[existingIndex], ...clearedBacklogRecord };
    } else {
      storedBacklogs.push(clearedBacklogRecord);
    }
    safeSet(STORAGE_KEYS.BACKLOGS, storedBacklogs);

    // Add specialized audit log for clearance
    try {
      auditHistoryService.recordEvent({
        action: 'CLEARED_BACKLOG',
        semesterNumber: sem.semesterNumber,
        semesterLabel: sem.semesterLabel || `Semester ${sem.semesterNumber}`,
        resultId: sem.id,
        academicPeriod: sem.academicPeriod,
        sgpa: calc.sgpa,
        cgpa: updatedSem?.cgpa || sem.cgpa,
        credits: calc.earnedCredits,
        subjectCount: updatedSubjects.length,
        status: calc.status,
        details: `Cleared backlog for ${subjectCode} (${targetSub.name || subjectCode}) in Semester ${sem.semesterNumber}. Passed with grade ${finalGrade} (${finalPoints} pts). SGPA updated to ${Number(calc.sgpa).toFixed(2)}.`
      });

      activityHistoryService.recordActivity({
        type: 'backlog',
        action: 'cleared',
        title: 'Cleared Backlog',
        description: `Subject ${cleanCode} cleared on re-attempt`,
        entityId: backlogKey,
        badgeValues: [cleanCode, `Semester ${sem.semesterNumber}`, 'Backlog Cleared'],
        resultMetric: { label: 'Grade', value: finalGrade, color: 'emerald' },
        metadata: {
          activityType: 'Backlog Clearance',
          semester: `Semester ${sem.semesterNumber}`,
          semesterNumber: sem.semesterNumber,
          subjectCode: cleanCode,
          subjectName: targetSub.name || cleanCode,
          credits: targetSub.credits,
          originalGrade: origGrade,
          clearedGrade: finalGrade,
          clearedPoints: finalPoints,
          clearedPeriod: period,
          remarks: `Cleared pending arrear on re-attempt examination with grade ${finalGrade} (${finalPoints} pts).`
        }
      });

      notificationService.notifyBacklogCleared(targetSub.name || cleanCode, finalGrade);
    } catch (e) {
      console.warn('Audit/Activity/Notification record warning:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('backlogs_data_updated'));
      window.dispatchEvent(new Event('academic_history_updated'));
      window.dispatchEvent(new Event('results_data_updated'));
    }

    return this.scanBacklogs();
  },

  getBacklogs() {
    return this.scanBacklogs().backlogs;
  },

  setBacklogs(backlogsList) {
    if (!Array.isArray(backlogsList)) return;
    safeSet(STORAGE_KEYS.BACKLOGS, backlogsList);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('backlogs_data_updated'));
    }
  },

  syncBacklogAuthoritative(clearedDto) {
    const storedBacklogs = safeGet(STORAGE_KEYS.BACKLOGS, []);
    const semNum = Number(clearedDto.semesterNumber);
    const existingIndex = storedBacklogs.findIndex(
      (b) => b.id === clearedDto.id || (b.subjectCode === clearedDto.subjectCode && Number(b.semesterNumber) === semNum)
    );
    let updatedList;
    if (existingIndex !== -1) {
      updatedList = storedBacklogs.map((b, idx) => (idx === existingIndex ? { ...b, ...clearedDto, status: 'Cleared' } : b));
    } else {
      updatedList = [...storedBacklogs, { ...clearedDto, status: 'Cleared' }];
    }
    safeSet(STORAGE_KEYS.BACKLOGS, updatedList);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('backlogs_data_updated'));
    }
    try {
      auditHistoryService.recordEvent({
        action: 'CLEARED_BACKLOG',
        semesterNumber: semNum,
        semesterLabel: `Semester ${semNum}`,
        details: `Cleared backlog for ${clearedDto.subjectCode} (${clearedDto.subjectName || clearedDto.subjectCode}) in Semester ${semNum}. Passed with grade ${clearedDto.clearedGrade || 'Pass'}.`
      });
      activityHistoryService.recordActivity({
        type: 'backlog',
        action: 'cleared',
        title: 'Cleared Backlog',
        description: `Cleared ${clearedDto.subjectCode} (${clearedDto.subjectName}) in Semester ${semNum}`,
        entityId: clearedDto.id,
        badgeValues: [`Semester ${semNum}`, clearedDto.subjectCode, `Grade ${clearedDto.clearedGrade || 'Pass'}`],
        resultMetric: { label: 'Status', value: 'Cleared', color: 'emerald' },
        metadata: {
          activityType: 'Backlog Clearance',
          subjectCode: clearedDto.subjectCode,
          semesterNumber: semNum,
          clearedGrade: clearedDto.clearedGrade,
          clearedPeriod: clearedDto.clearedInPeriod,
          remarks: 'Supplementary examination cleared.'
        }
      });
      notificationService.notifyBacklogCleared(clearedDto.subjectCode, semNum);
    } catch (e) {
      console.warn('Audit/Activity warning:', e);
    }

    const totalBacklogs = updatedList.length;
    const activeBacklogs = updatedList.filter((b) => b.status === 'Active').length;
    const clearedBacklogs = updatedList.filter((b) => b.status === 'Cleared').length;
    const clearanceRate = totalBacklogs > 0 ? Math.round((clearedBacklogs / totalBacklogs) * 100) : 100;
    const clearanceStatus = activeBacklogs === 0 ? 'All Clear' : `${activeBacklogs} Active`;

    return {
      backlogs: updatedList,
      totalBacklogs,
      activeBacklogs,
      clearedBacklogs,
      clearanceRate,
      clearanceStatus
    };
  },

  resetBacklogs() {
    safeSet(STORAGE_KEYS.BACKLOGS, []);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('backlogs_data_updated'));
    }
    return {
      backlogs: [],
      totalBacklogs: 0,
      activeBacklogs: 0,
      clearedBacklogs: 0,
      clearanceRate: 100,
      clearanceStatus: 'All Clear'
    };
  }
};

