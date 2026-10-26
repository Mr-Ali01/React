/**
 * ResultPoint Academic Catalog API Service
 * Integrates with backend Spring Boot CatalogController (/api/v1/catalog)
 * using the centralized apiClient.
 */

import { apiClient } from './apiClient.js';

// Bidirectional alias mapping between legacy/URL shorthand keys and backend database IDs
export const CATALOG_ID_ALIASES = {
  // Universities
  osmania: 'uni_ou',
  ou: 'uni_ou',
  uni_ou: 'uni_ou',
  jntuh: 'uni_jntuh',
  uni_jntuh: 'uni_jntuh',
  anna: 'uni_anna',
  au: 'uni_anna',
  uni_anna: 'uni_anna',
  vtu: 'uni_vtu',
  uni_vtu: 'uni_vtu',

  // Courses
  bca: 'course_ou_bca',
  'ou-bca': 'course_ou_bca',
  course_ou_bca: 'course_ou_bca',
  mca: 'course_ou_mca',
  'ou-mca': 'course_ou_mca',
  course_ou_mca: 'course_ou_mca',
  'bcom-gen': 'course_ou_bcom',
  bcom: 'course_ou_bcom',
  course_ou_bcom: 'course_ou_bcom',
  'btech-cse': 'course_jntuh_btech_cse',
  cse: 'course_jntuh_btech_cse',
  course_jntuh_btech_cse: 'course_jntuh_btech_cse',

  // Regulations
  'ou-bca-cbcs': 'reg_ou_bca_cbcs',
  reg_ou_bca_cbcs: 'reg_ou_bca_cbcs',
  'ou-mca-cbcs': 'reg_ou_mca_cbcs',
  reg_ou_mca_cbcs: 'reg_ou_mca_cbcs',
  'ou-bcom-cbcs': 'reg_ou_bcom_cbcs',
  reg_ou_bcom_cbcs: 'reg_ou_bcom_cbcs',
  'jntuh-cse-r18': 'reg_jntuh_r18',
  r18: 'reg_jntuh_r18',
  reg_jntuh_r18: 'reg_jntuh_r18',

  // Grading scales
  scale_ou_cbcs_s: 'scale_ou_cbcs_s',
  '10-point-s': 'scale_ou_cbcs_s',
  scale_standard_o: 'scale_standard_o',
  '10-point-o': 'scale_standard_o',
  '10-point': 'scale_standard_o',

  // Calculation rules
  rule_ou_cbcs_standard: 'rule_ou_cbcs_standard',
  rule_jntuh_r18: 'rule_jntuh_r18',
  rule_standard_ugc: 'rule_standard_ugc'
};

// Reverse mapping from backend canonical database IDs to local static catalog keys
export const BACKEND_TO_LOCAL_CATALOG_IDS = {
  // Universities
  uni_ou: 'osmania',
  uni_jntuh: 'jntuh',
  uni_anna: 'anna',
  uni_vtu: 'vtu',

  // Courses
  course_ou_bca: 'bca',
  course_ou_mca: 'mca',
  course_ou_bcom: 'bcom-gen',
  course_jntuh_btech_cse: 'btech-cse',

  // Regulations
  reg_ou_bca_cbcs: 'ou-bca-cbcs',
  reg_ou_mca_cbcs: 'ou-mca-cbcs',
  reg_ou_bcom_cbcs: 'ou-bcom-cbcs',
  reg_jntuh_r18: 'jntuh-cse-r18'
};

export const resolveToLocalCatalogId = (key) => {
  if (!key) return null;
  const cleanKey = String(key).trim().toLowerCase();
  return BACKEND_TO_LOCAL_CATALOG_IDS[cleanKey] || cleanKey;
};

export const catalogApi = {
  /**
   * Resolves any shorthand or legacy key to its canonical backend database ID.
   */
  resolveId(key) {
    if (!key) return null;
    const cleanKey = String(key).trim().toLowerCase();
    return CATALOG_ID_ALIASES[cleanKey] || key;
  },

  /**
   * Resolves a backend canonical database ID to its local static catalog key.
   */
  resolveToLocalId(key) {
    return resolveToLocalCatalogId(key);
  },

  /**
   * Search and list universities (paginated).
   * GET /api/v1/catalog/universities
   */
  async getUniversities(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sort) query.set('sort', params.sort);

    const queryString = query.toString();
    const endpoint = `/api/v1/catalog/universities${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(endpoint);
  },

  /**
   * Get single university detail with active degree programs.
   * GET /api/v1/catalog/universities/{universityId}
   */
  async getUniversityById(universityId) {
    const resolvedId = this.resolveId(universityId);
    return apiClient.get(`/api/v1/catalog/universities/${resolvedId}`);
  },

  /**
   * Search and list degree courses across universities.
   * GET /api/v1/catalog/courses
   */
  async getCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.universityId) query.set('universityId', this.resolveId(params.universityId));
    if (params.level) query.set('level', params.level);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sort) query.set('sort', params.sort);

    const queryString = query.toString();
    const endpoint = `/api/v1/catalog/courses${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(endpoint);
  },

  /**
   * List all courses offered by a specific university.
   * GET /api/v1/catalog/universities/{universityId}/courses
   */
  async getCoursesByUniversity(universityId) {
    const resolvedId = this.resolveId(universityId);
    return apiClient.get(`/api/v1/catalog/universities/${resolvedId}/courses`);
  },

  /**
   * Get course details with applicable academic regulations.
   * GET /api/v1/catalog/courses/{courseId}
   */
  async getCourseById(courseId) {
    const resolvedId = this.resolveId(courseId);
    return apiClient.get(`/api/v1/catalog/courses/${resolvedId}`);
  },

  /**
   * Search and list regulations.
   * GET /api/v1/catalog/regulations
   */
  async getRegulations(params = {}) {
    const query = new URLSearchParams();
    if (params.courseId) query.set('courseId', this.resolveId(params.courseId));
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);

    const queryString = query.toString();
    const endpoint = `/api/v1/catalog/regulations${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(endpoint);
  },

  /**
   * List all regulations applicable to a specific course.
   * GET /api/v1/catalog/courses/{courseId}/regulations
   */
  async getRegulationsByCourse(courseId) {
    const resolvedId = this.resolveId(courseId);
    return apiClient.get(`/api/v1/catalog/courses/${resolvedId}/regulations`);
  },

  /**
   * Get full regulation detail: grading scale, calculation rule, and admission batches.
   * GET /api/v1/catalog/regulations/{regulationId}
   */
  async getRegulationById(regulationId) {
    const resolvedId = this.resolveId(regulationId);
    return apiClient.get(`/api/v1/catalog/regulations/${resolvedId}`);
  },

  /**
   * Get curriculum subjects mapped to an academic regulation and optional semester.
   * GET /api/v1/catalog/regulations/{regulationId}/curriculum
   */
  async getRegulationCurriculum(regulationId, semesterNumber) {
    const resolvedId = this.resolveId(regulationId);
    const query = semesterNumber ? `?semesterNumber=${semesterNumber}` : '';
    return apiClient.get(`/api/v1/catalog/regulations/${resolvedId}/curriculum${query}`);
  }
};
