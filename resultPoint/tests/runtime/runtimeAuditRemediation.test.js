import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Set up mock window and storage for node environment
const mockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

globalThis.window = {
  localStorage: mockStorage(),
  sessionStorage: mockStorage(),
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, params = {}) {
    this.name = name;
    this.detail = params.detail;
  }
};
globalThis.Event = class Event {
  constructor(name) {
    this.name = name;
  }
};

const { catalogApi, resolveToLocalCatalogId } = await import('../../src/services/api/catalogApi.js');
const { academicCatalogService } = await import('../../src/services/academicCatalogService.js');
const { selectActivitySummary } = await import('../../src/features/activityHistory/activityHistorySlice.js');
const {
  selectEducationStats,
  selectFilteredEducationRecords,
  selectAllEducationRecords
} = await import('../../src/features/educationRecords/educationRecordsSlice.js');
const { studentProfileApi } = await import('../../src/services/api/studentProfileApi.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');

describe('ResultPoint Runtime Audit & Remediation Verification Suite', () => {

  beforeEach(() => {
    tokenStorage.clearSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  // =========================================================================
  // 1. Catalog ID Resolution & Academic Config
  // =========================================================================
  describe('1. Catalog ID Resolution & Full Configuration', () => {
    it('resolves canonical backend database IDs to local static catalog keys', () => {
      assert.equal(resolveToLocalCatalogId('uni_ou'), 'osmania');
      assert.equal(resolveToLocalCatalogId('course_ou_bca'), 'bca');
      assert.equal(resolveToLocalCatalogId('reg_ou_bca_cbcs'), 'ou-bca-cbcs');
      assert.equal(catalogApi.resolveToLocalId('uni_jntuh'), 'jntuh');
      assert.equal(catalogApi.resolveToLocalId('course_jntuh_btech_cse'), 'btech-cse');
      assert.equal(catalogApi.resolveToLocalId('reg_jntuh_r18'), 'jntuh-cse-r18');
    });

    it('academicCatalogService resolves university, course, and regulation with backend IDs', () => {
      const univ = academicCatalogService.getUniversityById('uni_ou');
      assert.ok(univ, 'University should be found using uni_ou');
      assert.equal(univ.id, 'osmania');
      assert.equal(univ.shortName, 'OU');

      const course = academicCatalogService.getCourse('uni_ou', 'course_ou_bca');
      assert.ok(course, 'Course should be found using uni_ou and course_ou_bca');
      assert.equal(course.id, 'bca');
      assert.equal(course.shortName, 'BCA');

      const reg = academicCatalogService.getRegulation('uni_ou', 'course_ou_bca', 'reg_ou_bca_cbcs');
      assert.ok(reg, 'Regulation should be found using reg_ou_bca_cbcs');
      assert.equal(reg.id, 'ou-bca-cbcs');
    });

    it('academicCatalogService.getFullConfiguration returns complete OU BCA CBCS config with S-Grade Scheme', () => {
      const config = academicCatalogService.getFullConfiguration('uni_ou', 'course_ou_bca', 'reg_ou_bca_cbcs');
      assert.ok(config, 'getFullConfiguration must return non-null configuration for uni_ou/course_ou_bca');
      assert.equal(config.university.shortName, 'OU');
      assert.equal(config.course.shortName, 'BCA');
      assert.equal(config.course.totalSemesters, 6);
      assert.equal(config.course.totalDegreeCredits, 150);

      // Verify S-Grade scheme is preserved in regulation
      assert.ok(config.regulation.gradingSystem.includes('S-Grade'), 'Grading system must be S-Grade scheme for OU BCA');
      const sGrade = config.gradeScale.find((g) => g.grade === 'S');
      assert.ok(sGrade, 'Grade S (Super) must exist for OU BCA');
      assert.equal(sGrade.points, 10);
      assert.equal(sGrade.desc, 'Super');
      assert.equal(sGrade.minPercentage, 85);

      // Verify calculation rule
      assert.ok(config.calculationRule, 'Calculation rule must be defined');
      assert.equal(config.calculationRule.percentageFormula, 'CGPA * 10');
    });
  });

  // =========================================================================
  // 2. Redux Selector Stability (Memoization & Reference Equality)
  // =========================================================================
  describe('2. Redux Selector Stability & Memoization', () => {
    it('selectActivitySummary returns identical reference on repeated calls with unchanged state', () => {
      const state = {
        activityHistory: {
          activities: [
            { id: 'act1', type: 'calculation' },
            { id: 'act2', type: 'calculation' },
            { id: 'act3', type: 'result' },
            { id: 'act4', type: 'goal' },
            { id: 'act5', type: 'backlog' }
          ]
        }
      };

      const ref1 = selectActivitySummary(state);
      const ref2 = selectActivitySummary(state);

      // Reference equality check
      assert.equal(ref1, ref2, 'selectActivitySummary must return stable memoized reference');
      assert.deepEqual(ref1, {
        totalActivities: 5,
        calculatorUsage: 2,
        resultUpdates: 1,
        goalUpdates: 1,
        backlogsCleared: 1
      });
    });

    it('selectEducationStats returns identical reference on repeated calls with unchanged state', () => {
      const state = {
        educationRecords: {
          records: [
            { id: 'r1', categoryGroup: 'School', category: 'School Education' },
            { id: 'r2', categoryGroup: 'Undergraduate', category: 'Undergraduate' },
            { id: 'r3', categoryGroup: 'Postgraduate', category: 'Postgraduate' }
          ]
        }
      };

      const ref1 = selectEducationStats(state);
      const ref2 = selectEducationStats(state);

      assert.equal(ref1, ref2, 'selectEducationStats must return stable memoized reference');
      assert.deepEqual(ref1, {
        allCount: 3,
        schoolCount: 1,
        ugCount: 1,
        pgCount: 1
      });
    });

    it('selectFilteredEducationRecords returns identical reference on repeated calls with unchanged state', () => {
      const state = {
        educationRecords: {
          records: [
            { id: 'r1', categoryGroup: 'School', level: '10th SSC', status: 'Completed' },
            { id: 'r2', categoryGroup: 'Undergraduate', level: 'B.Tech', status: 'In Progress' }
          ],
          activeFilterTab: 'ALL',
          searchQuery: '',
          statusFilter: 'ALL'
        }
      };

      const ref1 = selectFilteredEducationRecords(state);
      const ref2 = selectFilteredEducationRecords(state);

      assert.equal(ref1, ref2, 'selectFilteredEducationRecords must return stable memoized reference');
      assert.equal(ref1.length, 2);
    });

    it('selectAllEducationRecords uses stable empty array fallback when records are undefined', () => {
      const stateEmpty = { educationRecords: {} };
      const ref1 = selectAllEducationRecords(stateEmpty);
      const ref2 = selectAllEducationRecords(stateEmpty);

      assert.equal(ref1, ref2, 'selectAllEducationRecords fallback array must be reference stable');
      assert.deepEqual(ref1, []);
    });
  });

  // =========================================================================
  // 3. Resources Route / Component Import Integrity
  // =========================================================================
  describe('3. Resources Route Import & Component Integrity', () => {
    it('ResourcesPage component imports useEffect properly and has no undeclared hook references', () => {
      const filePath = path.resolve('src/pages/Resources/index.jsx');
      assert.ok(fs.existsSync(filePath), 'Resources index.jsx must exist');
      const content = fs.readFileSync(filePath, 'utf8');

      // Verify that useEffect is imported from react
      assert.match(
        content,
        /import\s+React,\s*\{[^}]*useEffect[^}]*\}\s+from\s+['"]react['"]/,
        'Resources/index.jsx must import useEffect from react'
      );

      // Verify that useEffect is called and event listeners cleaned up
      assert.match(content, /useEffect\s*\(\s*\(\)\s*=>/, 'Resources/index.jsx must define useEffect hook');
      assert.match(content, /removeEventListener\s*\(\s*RESOURCE_UPDATED_EVENT/, 'Must remove RESOURCE_UPDATED_EVENT listener on unmount');
      assert.match(content, /removeEventListener\s*\(\s*['"]storage['"]/, 'Must remove storage listener on unmount');
    });
  });

  // =========================================================================
  // 4. Academic Profile Setup & Persistence for New Registration
  // =========================================================================
  describe('4. Academic Profile Setup & Persistence for New Registration', () => {
    it('unconfigured student 404 is handled gracefully as null profile', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'StudentProfile not found', status: 404 }
        })
      });

      try {
        const profile = await studentProfileApi.getProfile();
        assert.equal(profile, null, 'Unconfigured student profile must return null without throwing');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('student profile submission resolves IDs and formats payload for backend PUT', async () => {
      let capturedUrl = null;
      let capturedBody = null;
      let capturedMethod = null;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedMethod = options.method;
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          headers: {
            get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
          },
          json: async () => ({
            success: true,
            data: {
              id: 'prof_123',
              userId: 'usr_new_student',
              universityId: capturedBody.universityId,
              courseId: capturedBody.courseId,
              regulationId: capturedBody.regulationId,
              batchYear: capturedBody.batchYear,
              hallTicketNumber: capturedBody.hallTicketNumber,
              currentSemester: capturedBody.currentSemester,
            }
          })
        };
      };

      try {
        tokenStorage.setAccessToken('test-token');
        const res = await studentProfileApi.updateProfile({
          universityId: 'uni_ou',
          courseId: 'course_ou_bca',
          regulationId: 'reg_ou_bca_cbcs',
          batchYear: '2023 - 2026',
          hallTicketNumber: '1005-24-733-001',
          currentSemester: 1
        });

        assert.equal(capturedMethod, 'PUT');
        assert.ok(capturedUrl.endsWith('/api/v1/student/profile'));
        assert.equal(capturedBody.universityId, 'uni_ou');
        assert.equal(capturedBody.courseId, 'course_ou_bca');
        assert.equal(capturedBody.regulationId, 'reg_ou_bca_cbcs');
        assert.equal(capturedBody.hallTicketNumber, '1005-24-733-001');
        assert.equal(res.id, 'prof_123');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
