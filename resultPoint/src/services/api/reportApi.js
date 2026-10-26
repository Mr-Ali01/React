/**
 * ResultPoint Student Academic Reports & Performance API
 * Integrates with backend Spring Boot StudentReportController (/api/v1/student/reports)
 * using the centralized apiClient.
 *
 * Security:
 * Strictly relies on authenticated Bearer token session.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 */

import { apiClient, ApiError } from './apiClient.js';

export const reportApi = {
  /**
   * Retrieves academic performance report: semester trends, SGPA/CGPA progression, and credit metrics
   * GET /api/v1/student/reports/performance
   */
  async getPerformanceReport() {
    try {
      const response = await apiClient.get('/api/v1/student/reports/performance');
      return response || null;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Retrieves backlog risk and clearance report
   * GET /api/v1/student/reports/backlogs
   */
  async getBacklogReport() {
    try {
      const response = await apiClient.get('/api/v1/student/reports/backlogs');
      return response || null;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Retrieves target CGPA projections report
   * GET /api/v1/student/reports/projections
   */
  async getProjectionReport() {
    try {
      const response = await apiClient.get('/api/v1/student/reports/projections');
      return response || null;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return null;
      }
      throw err;
    }
  }
};
