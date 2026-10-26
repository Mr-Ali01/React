/**
 * ResultPoint Student Backlog API Service
 * Integrates with backend Spring Boot StudentBacklogController (/api/v1/student/backlogs)
 * using the centralized apiClient.
 *
 * Authorization:
 * Strictly relies on the authenticated student session from Bearer token.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 */

import { apiClient, ApiError } from './apiClient.js';

/**
 * Normalizes backend StudentBacklogDto into frontend backlog item shape
 * @param {Object} dto Backend StudentBacklogDto
 * @returns {Object} Normalized backlog item conforming to frontend UI expectations
 */
export function normalizeBacklogDto(dto) {
  if (!dto) return null;
  const semNum = Number(dto.semesterNumber) || 1;
  const isCleared = String(dto.status || '').toUpperCase() === 'CLEARED';

  return {
    id: dto.id || `backlog_${dto.subjectCode}_s${semNum}`,
    studentProfileId: dto.studentProfileId,
    subjectCode: dto.subjectCode || 'SUB',
    subjectName: dto.subjectName || dto.subjectCode || 'Subject',
    semesterNumber: semNum,
    semesterLabel: `Semester ${semNum}`,
    academicPeriod: dto.clearedInPeriod || `Semester ${semNum} Exam`,
    credits: Number(dto.credits) || 4,
    grade: 'F',
    originalGrade: 'F',
    status: isCleared ? 'Cleared' : 'Active',
    backendStatus: isCleared ? 'CLEARED' : 'ACTIVE',
    clearedInSemester: isCleared ? semNum : null,
    clearedInPeriod: dto.clearedInPeriod || null,
    clearedPeriod: dto.clearedInPeriod || null,
    clearedGrade: dto.clearedGrade || null,
    clearedAt: dto.clearedAt || null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

export const backlogApi = {
  /**
   * Retrieves active or cleared backlogs for the authenticated student
   * GET /api/v1/student/backlogs
   * @param {string} [status] Optional filter: 'ACTIVE' or 'CLEARED'
   * @returns {Promise<Array>} List of normalized backlog records
   */
  async getBacklogs(status) {
    try {
      const endpoint = status ? `/api/v1/student/backlogs?status=${encodeURIComponent(status)}` : '/api/v1/student/backlogs';
      const response = await apiClient.get(endpoint);
      const list = Array.isArray(response) ? response : [];
      return list.map(normalizeBacklogDto);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Manually updates backlog status to cleared following supplementary exam evaluation
   * POST /api/v1/student/backlogs/clear
   * @param {Object} data { backlogId, clearedInPeriod, clearedGrade }
   * @returns {Promise<Object>} Authoritative cleared backlog record normalized
   */
  async clearBacklog(data = {}) {
    if (!data.backlogId || !String(data.backlogId).trim()) {
      throw new Error('Backlog ID is required');
    }
    if (!data.clearedInPeriod || !String(data.clearedInPeriod).trim()) {
      throw new Error('Cleared academic period is required');
    }
    if (!data.clearedGrade || !String(data.clearedGrade).trim()) {
      throw new Error('Cleared grade letter is required');
    }

    const payload = {
      backlogId: String(data.backlogId).trim(),
      clearedInPeriod: String(data.clearedInPeriod).trim(),
      clearedGrade: String(data.clearedGrade).trim().toUpperCase()
    };

    const response = await apiClient.post('/api/v1/student/backlogs/clear', payload);
    return normalizeBacklogDto(response);
  }
};
