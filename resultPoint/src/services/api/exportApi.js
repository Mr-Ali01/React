/**
 * ResultPoint Student PDF Export API Client
 * Integrates with backend Spring Boot PdfExportController (/api/v1/student/...)
 * using the centralized apiClient.
 *
 * Security:
 * Strictly relies on authenticated Bearer token session.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 */

import { apiClient } from './apiClient.js';

export function triggerBlobDownload(blob, filename) {
  if (typeof window === 'undefined' || !blob) return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export const exportApi = {
  /**
   * Downloads official semester scorecard in PDF format
   * GET /api/v1/student/results/{semesterNumber}/pdf
   * @param {number|string} semesterNumber
   * @returns {Promise<Blob>}
   */
  async downloadSemesterScorecardPdf(semesterNumber) {
    const sem = Number(semesterNumber);
    if (isNaN(sem) || sem < 1) {
      throw new Error('Valid semester number is required to export scorecard PDF');
    }
    const blob = await apiClient.get(`/api/v1/student/results/${sem}/pdf`, {
      responseType: 'blob'
    });
    return blob;
  },

  /**
   * Downloads consolidated academic transcript in PDF format
   * GET /api/v1/student/results/history/pdf
   * @returns {Promise<Blob>}
   */
  async downloadAcademicTranscriptPdf() {
    const blob = await apiClient.get('/api/v1/student/results/history/pdf', {
      responseType: 'blob'
    });
    return blob;
  },

  /**
   * Downloads academic goals & progress report in PDF format
   * GET /api/v1/student/goals/report/pdf
   * @returns {Promise<Blob>}
   */
  async downloadGoalsReportPdf() {
    const blob = await apiClient.get('/api/v1/student/goals/report/pdf', {
      responseType: 'blob'
    });
    return blob;
  }
};
