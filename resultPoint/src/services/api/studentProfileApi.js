/**
 * ResultPoint Student Profile API Service
 * Integrates with backend Spring Boot StudentProfileController (/api/v1/student/profile)
 * using the centralized apiClient.
 *
 * Strictly relies on the authenticated student session from Bearer token.
 * Never supplies or trusts client-side user IDs for profile authorization.
 */

import { apiClient, ApiError } from './apiClient.js';
import { catalogApi } from './catalogApi.js';

export const studentProfileApi = {
  /**
   * Retrieves the academic profile and stats for the authenticated student.
   * GET /api/v1/student/profile
   *
   * @returns {Promise<Object|null>} StudentProfileDto if exists, or null if profile not yet created (404)
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/api/v1/student/profile');
      return response;
    } catch (err) {
      // 404 RESOURCE_NOT_FOUND means the user is authenticated but has not completed profile setup
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Creates or updates the academic profile for the authenticated student.
   * PUT /api/v1/student/profile
   *
   * @param {Object} data - Profile updates adhering to UpdateStudentProfileRequest contract
   * @returns {Promise<Object>} Updated StudentProfileDto
   */
  async updateProfile(data = {}) {
    if (!data.universityId) {
      throw new Error('University ID is required');
    }
    if (!data.courseId) {
      throw new Error('Course ID is required');
    }
    if (!data.regulationId) {
      throw new Error('Regulation ID is required');
    }
    if (!data.hallTicketNumber || !String(data.hallTicketNumber).trim()) {
      throw new Error('Hall ticket number is required');
    }

    // Resolve shorthand or legacy catalog aliases to canonical database IDs
    const resolvedUniversityId = catalogApi.resolveId(data.universityId);
    const resolvedCourseId = catalogApi.resolveId(data.courseId);
    const resolvedRegulationId = catalogApi.resolveId(data.regulationId);

    // Format gender to backend enum (MALE, FEMALE, OTHER)
    let formattedGender = undefined;
    if (data.gender) {
      const g = String(data.gender).trim().toUpperCase();
      if (g === 'MALE' || g === 'FEMALE' || g === 'OTHER') {
        formattedGender = g;
      }
    }

    // Format currentSemester (default 1, max 12)
    const currentSemester = Number(data.currentSemester) || 1;

    // Format targetCgpa (between 0.0 and 10.0)
    let targetCgpa = undefined;
    if (data.targetCgpa !== undefined && data.targetCgpa !== null && data.targetCgpa !== '') {
      const num = Number(data.targetCgpa);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        targetCgpa = num;
      }
    }

    // Format batchYear
    const batchYear = String(data.batchYear || data.batch || '2024-2028').trim();

    const requestBody = {
      universityId: resolvedUniversityId,
      courseId: resolvedCourseId,
      regulationId: resolvedRegulationId,
      batchYear,
      hallTicketNumber: String(data.hallTicketNumber).trim(),
      ...(data.institutionName ? { institutionName: String(data.institutionName).trim() } : {}),
      currentSemester,
      ...(data.dateOfBirth || data.dob ? { dateOfBirth: data.dateOfBirth || data.dob } : {}),
      ...(formattedGender ? { gender: formattedGender } : {}),
      ...(targetCgpa !== undefined ? { targetCgpa } : {})
    };

    return apiClient.put('/api/v1/student/profile', requestBody);
  }
};
