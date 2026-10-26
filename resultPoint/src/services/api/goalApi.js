/**
 * ResultPoint Student Academic Goals API Client
 * Integrates with backend Spring Boot StudentGoalController (/api/v1/student/goals)
 * using the centralized apiClient.
 *
 * Security:
 * Strictly relies on authenticated Bearer token session.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 */

import { apiClient, ApiError } from './apiClient.js';

export function normalizeGoalDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    studentProfileId: dto.studentProfileId,
    targetCGPA: Number(dto.targetCgpa) || 8.5,
    targetCgpa: Number(dto.targetCgpa) || 8.5,
    targetSemester: Number(dto.targetSemester) || 6,
    requiredSGPA: dto.requiredSgpa !== null && dto.requiredSgpa !== undefined ? Number(dto.requiredSgpa) : null,
    requiredSgpa: dto.requiredSgpa !== null && dto.requiredSgpa !== undefined ? Number(dto.requiredSgpa) : null,
    feasibilityStatus: dto.feasibilityStatus || 'FEASIBLE',
    active: dto.active !== false,
    isActive: dto.active !== false,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

export const goalApi = {
  /**
   * Retrieves all goals for the authenticated student
   * GET /api/v1/student/goals
   * @returns {Promise<Array>}
   */
  async getGoals() {
    try {
      const response = await apiClient.get('/api/v1/student/goals');
      const list = Array.isArray(response) ? response : [];
      return list.map(normalizeGoalDto);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Creates an academic target goal
   * POST /api/v1/student/goals
   * @param {Object} data { targetCgpa, targetSemester }
   * @returns {Promise<Object>}
   */
  async createGoal(data = {}) {
    const targetCgpa = Number(data.targetCgpa ?? data.targetCGPA);
    const targetSemester = Number(data.targetSemester) || 6;

    if (isNaN(targetCgpa) || targetCgpa < 0 || targetCgpa > 10) {
      throw new Error('Valid target CGPA between 0.0 and 10.0 is required');
    }

    const payload = {
      targetCgpa,
      targetSemester
    };

    const response = await apiClient.post('/api/v1/student/goals', payload);
    return normalizeGoalDto(response);
  },

  /**
   * Updates an existing academic goal
   * PUT /api/v1/student/goals/{id}
   * @param {string} id
   * @param {Object} data { targetCgpa, targetSemester, isActive }
   * @returns {Promise<Object>}
   */
  async updateGoal(id, data = {}) {
    if (!id) {
      throw new Error('Goal ID is required to update');
    }

    const payload = {};
    if (data.targetCgpa !== undefined || data.targetCGPA !== undefined) {
      payload.targetCgpa = Number(data.targetCgpa ?? data.targetCGPA);
    }
    if (data.targetSemester !== undefined) {
      payload.targetSemester = Number(data.targetSemester);
    }
    if (data.isActive !== undefined || data.active !== undefined) {
      payload.isActive = Boolean(data.isActive ?? data.active);
    }

    const response = await apiClient.put(`/api/v1/student/goals/${encodeURIComponent(id)}`, payload);
    return normalizeGoalDto(response);
  },

  /**
   * Deletes an academic goal
   * DELETE /api/v1/student/goals/{id}
   * @param {string} id
   */
  async deleteGoal(id) {
    if (!id) {
      throw new Error('Goal ID is required to delete');
    }
    await apiClient.delete(`/api/v1/student/goals/${encodeURIComponent(id)}`);
    return id;
  }
};
