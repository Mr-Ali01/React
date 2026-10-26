/**
 * ResultPoint Semester Results & Academic Calculation API Service
 * Integrates with backend Spring Boot SemesterResultController (/api/v1/student/results)
 * using the centralized apiClient.
 *
 * Authorization:
 * Strictly relies on the authenticated student session from Bearer token.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 */

import { apiClient, ApiError } from './apiClient.js';

/**
 * Normalizes subject input from UI into backend SubjectResultInputDto
 * @param {Object} s Subject from UI form
 * @returns {Object} SubjectResultInputDto conforming to backend contract
 */
export function normalizeSubjectInput(s = {}) {
  const code = (s.code || s.subjectCode || '').trim();
  const name = (s.name || s.subjectName || '').trim();
  const credits = Number(s.credits != null ? s.credits : (s.defaultCredits != null ? s.defaultCredits : 4));

  const subject = {
    subjectCode: code || 'SUB',
    subjectName: name || 'Subject',
    credits: isNaN(credits) || credits <= 0 ? 4 : credits,
  };

  if (s.grade || s.gradeLetter) {
    subject.gradeLetter = String(s.grade || s.gradeLetter).trim().toUpperCase();
  }

  if (s.points !== undefined && s.points !== null && s.points !== '') {
    subject.gradePoints = Number(s.points);
  } else if (s.gradePoints !== undefined && s.gradePoints !== null && s.gradePoints !== '') {
    subject.gradePoints = Number(s.gradePoints);
  }

  if (s.internalMarks !== undefined && s.internalMarks !== null && s.internalMarks !== '') {
    subject.internalMarks = Number(s.internalMarks);
  }

  if (s.externalMarks !== undefined && s.externalMarks !== null && s.externalMarks !== '') {
    subject.externalMarks = Number(s.externalMarks);
  } else if (s.marksObtained !== undefined && s.marksObtained !== null && s.marksObtained !== '' && !isNaN(Number(s.marksObtained))) {
    // If marks were explicitly entered and no separate internal/external marks exist
    subject.externalMarks = Number(s.marksObtained);
    if (subject.internalMarks === undefined) {
      subject.internalMarks = 0;
    }
  }

  if (s.maxMarks !== undefined && s.maxMarks !== null && s.maxMarks !== '') {
    subject.maxMarks = Number(s.maxMarks);
  }

  return subject;
}

/**
 * Normalizes backend SemesterResultDto into frontend scorecard shape
 * @param {Object} dto Backend SemesterResultDto
 * @returns {Object} Normalized scorecard object
 */
export function normalizeSemesterResultDto(dto) {
  if (!dto) return null;
  const semNum = Number(dto.semesterNumber);
  const sgpa = Number(dto.sgpa) || 0;
  const cgpa = Number(dto.cgpa != null ? dto.cgpa : sgpa);
  const totalCredits = Number(dto.totalCredits) || 0;
  const creditsEarned = Number(dto.creditsEarned != null ? dto.creditsEarned : totalCredits);
  const equivalentPercentage = dto.equivalentPercentage != null ? Number(dto.equivalentPercentage) : null;

  const subjects = Array.isArray(dto.subjects)
    ? dto.subjects.map((sub, idx) => {
        const isPass = sub.pass != null ? Boolean(sub.pass) : (sub.isPass != null ? Boolean(sub.isPass) : true);
        const credits = Number(sub.credits) || 4;
        const points = Number(sub.gradePoints != null ? sub.gradePoints : 0);
        const totalMarks = sub.totalMarks != null ? Number(sub.totalMarks) : (
          sub.internalMarks != null && sub.externalMarks != null
            ? Number(sub.internalMarks) + Number(sub.externalMarks)
            : null
        );
        return {
          id: sub.id || `sub_${semNum}_${idx}`,
          code: sub.subjectCode || '',
          name: sub.subjectName || '',
          credits,
          defaultCredits: credits,
          grade: sub.gradeLetter || '-',
          points,
          internalMarks: sub.internalMarks != null ? Number(sub.internalMarks) : null,
          externalMarks: sub.externalMarks != null ? Number(sub.externalMarks) : null,
          totalMarks,
          marksObtained: totalMarks != null ? totalMarks : 0,
          isPass,
          pass: isPass
        };
      })
    : [];

  return {
    id: dto.id || `semester-${semNum}`,
    studentProfileId: dto.studentProfileId,
    semesterNumber: semNum,
    semesterLabel: `Semester ${semNum}`,
    semesterTitle: `Semester ${semNum}`,
    academicPeriod: dto.academicPeriod || `Semester ${semNum} Exam`,
    subjectCount: subjects.length,
    totalCredits,
    creditsEarned,
    sgpa,
    cgpa,
    equivalentPercentage,
    status: dto.standingStatus || (sgpa >= 8.5 ? 'Excellent' : sgpa >= 8.0 ? 'Very Good' : sgpa >= 7.0 ? 'Good' : 'Average'),
    standingStatus: dto.standingStatus || 'Pass',
    badgeColor: sgpa >= 8.5 ? 'purple' : sgpa >= 7.5 ? 'blue' : 'emerald',
    ruleVersionSnapshot: dto.ruleVersionSnapshot,
    gradingScaleSnapshotJson: dto.gradingScaleSnapshotJson,
    calculationRuleSnapshotJson: dto.calculationRuleSnapshotJson,
    subjects,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

export const resultApi = {
  /**
   * Retrieves all verified semester scorecards for authenticated student
   * GET /api/v1/student/results
   * @returns {Promise<Array>} List of normalized semester results
   */
  async getResults() {
    try {
      const response = await apiClient.get('/api/v1/student/results');
      const list = Array.isArray(response) ? response : [];
      return list.map(normalizeSemesterResultDto);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Retrieves detailed scorecard for a specific semester
   * GET /api/v1/student/results/{semesterNumber}
   * @param {number|string} semesterNumber
   * @returns {Promise<Object|null>} Normalized semester result
   */
  async getResultBySemester(semesterNumber) {
    const semNum = Number(semesterNumber);
    if (!semNum || isNaN(semNum)) {
      throw new Error(`Invalid semester number: ${semesterNumber}`);
    }
    try {
      const response = await apiClient.get(`/api/v1/student/results/${semNum}`);
      return normalizeSemesterResultDto(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Retrieves student academic history with semester scorecards and progression summary
   * GET /api/v1/student/results/history
   * @returns {Promise<Object|null>} Academic history object
   */
  async getAcademicHistory() {
    try {
      const response = await apiClient.get('/api/v1/student/results/history');
      if (!response) return null;
      return {
        summary: response.summary,
        history: Array.isArray(response.history) ? response.history.map(normalizeSemesterResultDto) : []
      };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Submits and freezes a semester result scorecard
   * POST /api/v1/student/results
   * @param {Object} data Semester result data containing semesterNumber, academicPeriod, subjects
   * @returns {Promise<Object>} Authoritative backend SemesterResultDto normalized
   */
  async saveResult(data = {}) {
    const semNum = Number(data.semesterNumber);
    if (!semNum || isNaN(semNum) || semNum < 1) {
      throw new Error('Semester number must be at least 1');
    }
    const period = String(data.academicPeriod || `Semester ${semNum} Exam`).trim();
    if (!period) {
      throw new Error('Academic period is required');
    }
    if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
      throw new Error('Subjects list cannot be empty');
    }

    const payload = {
      semesterNumber: semNum,
      academicPeriod: period,
      subjects: data.subjects.map(normalizeSubjectInput)
    };

    const response = await apiClient.post('/api/v1/student/results', payload);
    return normalizeSemesterResultDto(response);
  },

  /**
   * Updates an existing semester result scorecard and recomputes stats
   * PUT /api/v1/student/results/{semesterNumber}
   * @param {number|string} semesterNumber
   * @param {Object} data Updated semester result data
   * @returns {Promise<Object>} Authoritative backend SemesterResultDto normalized
   */
  async updateResult(semesterNumber, data = {}) {
    const semNum = Number(semesterNumber || data.semesterNumber);
    if (!semNum || isNaN(semNum) || semNum < 1) {
      throw new Error('Semester number must be at least 1');
    }
    const period = String(data.academicPeriod || `Semester ${semNum} Exam`).trim();
    if (!period) {
      throw new Error('Academic period is required');
    }
    if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
      throw new Error('Subjects list cannot be empty');
    }

    const payload = {
      semesterNumber: semNum,
      academicPeriod: period,
      subjects: data.subjects.map(normalizeSubjectInput)
    };

    const response = await apiClient.put(`/api/v1/student/results/${semNum}`, payload);
    return normalizeSemesterResultDto(response);
  },

  /**
   * Deletes a semester scorecard and recalculates cumulative academic stats
   * DELETE /api/v1/student/results/{semesterNumber}
   * @param {number|string} semesterNumber
   * @returns {Promise<number>} Deleted semester number
   */
  async deleteResult(semesterNumber) {
    const semNum = Number(semesterNumber);
    if (!semNum || isNaN(semNum)) {
      throw new Error(`Invalid semester number: ${semesterNumber}`);
    }
    await apiClient.delete(`/api/v1/student/results/${semNum}`);
    return semNum;
  }
};
