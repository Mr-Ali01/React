/**
 * ResultPoint Calculation API Service
 * Integrates with backend Spring Boot CalculationController (/api/v1/calculate)
 * using the centralized apiClient.
 */

import { apiClient } from './apiClient.js';
import { catalogApi } from './catalogApi.js';

export const calculationApi = {
  /**
   * Calculate SGPA with credit weighting and grade scale mapping.
   * POST /api/v1/calculate/sgpa
   */
  async calculateSgpa({ universityId, regulationId, subjects = [] }) {
    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new Error('At least one subject must be provided for SGPA calculation');
    }

    const resolvedUniId = catalogApi.resolveId(universityId);
    const resolvedRegId = catalogApi.resolveId(regulationId);

    const formattedSubjects = subjects.map((s, idx) => {
      const credits = Number(s.credits) || 0;
      const gradePoints = s.points !== undefined && s.points !== null && s.points !== ''
        ? Number(s.points)
        : (s.gradePoints !== undefined ? Number(s.gradePoints) : undefined);
      const letterGrade = s.grade || s.letterGrade || undefined;
      const marksObtained = s.marksObtained !== undefined && s.marksObtained !== null && s.marksObtained !== ''
        ? Number(s.marksObtained)
        : undefined;
      const maxMarks = s.maxMarks !== undefined && s.maxMarks !== null && s.maxMarks !== ''
        ? Number(s.maxMarks)
        : undefined;

      return {
        subjectCode: s.code || s.subjectCode || `SUB${idx + 1}`,
        subjectName: s.name || s.subjectName || `Subject ${idx + 1}`,
        credits,
        ...(gradePoints !== undefined && !isNaN(gradePoints) ? { gradePoints } : {}),
        ...(letterGrade ? { letterGrade } : {}),
        ...(marksObtained !== undefined && !isNaN(marksObtained) ? { marksObtained } : {}),
        ...(maxMarks !== undefined && !isNaN(maxMarks) ? { maxMarks } : {})
      };
    });

    const body = {
      ...(resolvedUniId ? { universityId: resolvedUniId } : {}),
      ...(resolvedRegId ? { regulationId: resolvedRegId } : {}),
      subjects: formattedSubjects
    };

    return apiClient.post('/api/v1/calculate/sgpa', body);
  },

  /**
   * Calculate CGPA from multi-semester SGPA inputs.
   * POST /api/v1/calculate/cgpa
   */
  async calculateCgpa({ universityId, regulationId, semesters = [] }) {
    if (!Array.isArray(semesters) || semesters.length === 0) {
      throw new Error('At least one semester must be provided for CGPA calculation');
    }

    const resolvedUniId = catalogApi.resolveId(universityId);
    const resolvedRegId = catalogApi.resolveId(regulationId);

    const formattedSemesters = semesters.map((sem, idx) => ({
      semesterNumber: sem.semesterNumber || idx + 1,
      sgpa: Number(sem.sgpa) || 0,
      credits: Number(sem.credits) || Number(sem.totalCredits) || Number(sem.creditsEarned) || 20
    }));

    const body = {
      ...(resolvedUniId ? { universityId: resolvedUniId } : {}),
      ...(resolvedRegId ? { regulationId: resolvedRegId } : {}),
      semesters: formattedSemesters
    };

    return apiClient.post('/api/v1/calculate/cgpa', body);
  },

  /**
   * Convert CGPA to official percentage using institutional regulation rules.
   * POST /api/v1/calculate/percentage
   */
  async calculatePercentage({ cgpa, universityId, regulationId, ruleCode }) {
    const numCgpa = Number(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      throw new Error('Valid CGPA between 0.0 and 10.0 is required');
    }

    const resolvedUniId = catalogApi.resolveId(universityId);
    const resolvedRegId = catalogApi.resolveId(regulationId);
    const resolvedRuleCode = catalogApi.resolveId(ruleCode);

    const body = {
      cgpa: numCgpa,
      ...(resolvedUniId ? { universityId: resolvedUniId } : {}),
      ...(resolvedRegId ? { regulationId: resolvedRegId } : {}),
      ...(resolvedRuleCode ? { ruleCode: resolvedRuleCode } : {})
    };

    return apiClient.post('/api/v1/calculate/percentage', body);
  },

  /**
   * Determine required future semester SGPA to achieve target honors CGPA.
   * POST /api/v1/calculate/target-cgpa
   */
  async calculateTargetCgpa({
    currentCgpa,
    targetCgpa,
    completedCredits,
    remainingCredits,
    completedSemesters,
    totalSemesters,
    remainingSemesters
  }) {
    const cur = Number(currentCgpa);
    const tgt = Number(targetCgpa);

    if (isNaN(cur) || cur < 0 || cur > 10) {
      throw new Error('Valid current CGPA between 0.0 and 10.0 is required');
    }
    if (isNaN(tgt) || tgt < 0 || tgt > 10) {
      throw new Error('Valid target CGPA between 0.0 and 10.0 is required');
    }

    const body = {
      currentCgpa: cur,
      targetCgpa: tgt,
      ...(completedCredits !== undefined && completedCredits !== null ? { completedCredits: Number(completedCredits) } : {}),
      ...(remainingCredits !== undefined && remainingCredits !== null ? { remainingCredits: Number(remainingCredits) } : {}),
      ...(completedSemesters !== undefined && completedSemesters !== null ? { completedSemesters: Number(completedSemesters) } : {}),
      ...(totalSemesters !== undefined && totalSemesters !== null ? { totalSemesters: Number(totalSemesters) } : {}),
      ...(remainingSemesters !== undefined && remainingSemesters !== null ? { remainingSemesters: Number(remainingSemesters) } : {})
    };

    return apiClient.post('/api/v1/calculate/target-cgpa', body);
  },

  /**
   * List all supported grading scales and grade boundaries.
   * GET /api/v1/calculate/scales
   */
  async getGradingScales() {
    return apiClient.get('/api/v1/calculate/scales');
  },

  /**
   * Get specific grading scale and its letter-grade boundaries.
   * GET /api/v1/calculate/scales/{scaleId}
   */
  async getGradingScaleById(scaleId) {
    const resolvedId = catalogApi.resolveId(scaleId);
    return apiClient.get(`/api/v1/calculate/scales/${resolvedId}`);
  },

  /**
   * List all registered institutional calculation rules.
   * GET /api/v1/calculate/rules
   */
  async getCalculationRules() {
    return apiClient.get('/api/v1/calculate/rules');
  },

  /**
   * Get specific calculation rule formula and rounding configuration.
   * GET /api/v1/calculate/rules/{ruleId}
   */
  async getCalculationRuleById(ruleId) {
    const resolvedId = catalogApi.resolveId(ruleId);
    return apiClient.get(`/api/v1/calculate/rules/${resolvedId}`);
  }
};
