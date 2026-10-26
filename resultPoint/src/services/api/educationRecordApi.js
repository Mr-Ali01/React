/**
 * ResultPoint Education Records API Client
 * Integrates with backend Spring Boot EducationRecordController (/api/v1/student/education-records)
 * using the centralized apiClient.
 *
 * Security:
 * Strictly relies on authenticated Bearer token session.
 * Never supplies or trusts client-supplied student/user IDs for authorization.
 *
 * Architecture Note on Backend Contract:
 * Backend exposes GET, POST, and DELETE endpoints for education records.
 * Note: Backend does NOT provide a PUT / update endpoint.
 */

import { apiClient, ApiError } from './apiClient.js';

export function normalizeCategoryGroup(val) {
  if (!val) return 'COLLEGE';
  const s = String(val).toUpperCase();
  if (s.includes('SCHOOL') || s.includes('10') || s.includes('12') || s.includes('SECONDARY')) return 'SCHOOL';
  if (s.includes('UNIV') || s.includes('POST') || s.includes('GRAD') || s.includes('DEGREE') || s.includes('PG') || s.includes('UG')) return 'UNIVERSITY';
  if (s.includes('COLLEGE') || s.includes('INTER')) return 'COLLEGE';
  return 'COLLEGE';
}

export function normalizeEducationType(type, level) {
  const t = String(type || level || '').toUpperCase();
  if (t.includes('10') || t.includes('SECONDARY')) return 'CLASS_10';
  if (t.includes('12') || t.includes('INTER')) return 'CLASS_12';
  if (t.includes('POST') || t.includes('PG') || t.includes('MCA') || t.includes('MBA') || t.includes('M.TECH')) return 'POSTGRADUATE';
  return 'UNDERGRADUATE';
}

export function normalizeEducationRecordDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    userId: dto.userId,
    type: dto.type,
    level: dto.level || 'Degree',
    categoryGroup: dto.categoryGroup,
    category: dto.categoryGroup === 'SCHOOL' ? 'School Education' : dto.categoryGroup === 'COLLEGE' ? 'Higher Secondary' : 'Higher Education',
    board: dto.boardOrUniversity,
    boardOrUniversity: dto.boardOrUniversity,
    schoolName: dto.institutionName,
    institutionName: dto.institutionName,
    passingYear: Number(dto.passingYear) || 2024,
    academicYear: dto.academicYear || `${(Number(dto.passingYear) || 2024) - 1}-${Number(dto.passingYear) || 2024}`,
    rollNumber: dto.rollNumber || '',
    entryMode: dto.entryMode || 'QUICK',
    resultStatus: dto.resultStatus || 'COMPLETED',
    status: dto.resultStatus === 'COMPLETED' ? 'Completed' : 'Pursuing',
    totalMarks: dto.totalMarks !== null && dto.totalMarks !== undefined ? Number(dto.totalMarks) : null,
    maxMarks: dto.maxMarks !== null && dto.maxMarks !== undefined ? Number(dto.maxMarks) : null,
    percentage: dto.percentage !== null && dto.percentage !== undefined ? Number(dto.percentage) : null,
    cgpa: dto.cgpa !== null && dto.cgpa !== undefined ? Number(dto.cgpa) : null,
    finalGrade: dto.finalGrade || '',
    subjects: Array.isArray(dto.subjects)
      ? dto.subjects.map((s, idx) => ({
          id: s.id || `sub_${idx}`,
          name: s.subjectName || 'Subject',
          subjectName: s.subjectName || 'Subject',
          code: s.subjectCode || '',
          subjectCode: s.subjectCode || '',
          marksObtained: s.marksObtained !== null && s.marksObtained !== undefined ? Number(s.marksObtained) : null,
          maxMarks: s.maxMarks !== null && s.maxMarks !== undefined ? Number(s.maxMarks) : 100,
          grade: s.grade || '',
          credits: s.credits !== null && s.credits !== undefined ? Number(s.credits) : null
        }))
      : [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

export const educationRecordApi = {
  /**
   * Retrieves all education records for the authenticated student
   * GET /api/v1/student/education-records
   * @returns {Promise<Array>}
   */
  async getEducationRecords() {
    try {
      const response = await apiClient.get('/api/v1/student/education-records');
      const list = Array.isArray(response) ? response : [];
      return list.map(normalizeEducationRecordDto);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Creates an education qualification record
   * POST /api/v1/student/education-records
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createEducationRecord(data = {}) {
    const type = normalizeEducationType(data.type, data.level);
    const categoryGroup = normalizeCategoryGroup(data.categoryGroup || data.category || data.type);
    const boardOrUniversity = String(data.boardOrUniversity || data.board || data.university || '').trim();
    const institutionName = String(data.institutionName || data.schoolName || data.college || '').trim();
    const passingYear = Number(data.passingYear);

    if (!boardOrUniversity) {
      throw new Error('Board or University name is required');
    }
    if (!institutionName) {
      throw new Error('Institution name is required');
    }
    if (isNaN(passingYear) || passingYear < 1950) {
      throw new Error('Passing year must be valid (1950 or later)');
    }

    const payload = {
      type,
      level: String(data.level || type).trim(),
      categoryGroup,
      boardOrUniversity,
      institutionName,
      passingYear,
      academicYear: data.academicYear || `${passingYear - 1}-${passingYear}`,
      rollNumber: data.rollNumber || null,
      entryMode: data.entryMode || 'QUICK',
      resultStatus: data.resultStatus ? String(data.resultStatus).toUpperCase() : 'COMPLETED',
      totalMarks: data.totalMarks !== undefined && data.totalMarks !== null ? Number(data.totalMarks) : null,
      maxMarks: data.maxMarks !== undefined && data.maxMarks !== null ? Number(data.maxMarks) : null,
      percentage: data.percentage !== undefined && data.percentage !== null ? Number(data.percentage) : null,
      cgpa: data.cgpa !== undefined && data.cgpa !== null ? Number(data.cgpa) : null,
      finalGrade: data.finalGrade || null,
      subjects: Array.isArray(data.subjects)
        ? data.subjects.map((s) => ({
            subjectName: s.name || s.subjectName || 'Subject',
            subjectCode: s.code || s.subjectCode || null,
            marksObtained: s.marksObtained !== undefined && s.marksObtained !== null ? Number(s.marksObtained) : null,
            maxMarks: s.maxMarks !== undefined && s.maxMarks !== null ? Number(s.maxMarks) : 100,
            grade: s.grade || null,
            credits: s.credits !== undefined && s.credits !== null ? Number(s.credits) : null
          }))
        : []
    };

    const response = await apiClient.post('/api/v1/student/education-records', payload);
    return normalizeEducationRecordDto(response);
  },

  /**
   * Deletes an education record by ID
   * DELETE /api/v1/student/education-records/{id}
   * @param {string} id
   */
  async deleteEducationRecord(id) {
    if (!id) {
      throw new Error('Education record ID is required');
    }
    await apiClient.delete(`/api/v1/student/education-records/${encodeURIComponent(id)}`);
    return id;
  }
};
