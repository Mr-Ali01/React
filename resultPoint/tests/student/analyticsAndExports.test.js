import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

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

const { reportApi } = await import('../../src/services/api/reportApi.js');
const { exportApi } = await import('../../src/services/api/exportApi.js');
const {
  educationRecordApi,
  normalizeEducationRecordDto,
  normalizeEducationType,
  normalizeCategoryGroup
} = await import('../../src/services/api/educationRecordApi.js');
const { goalApi, normalizeGoalDto } = await import('../../src/services/api/goalApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');

const {
  default: performanceReducer,
  fetchPerformanceData,
  resetPerformanceState
} = await import('../../src/features/performance/performanceSlice.js');

const {
  default: educationRecordsReducer,
  fetchEducationRecords,
  addEducationRecord,
  deleteEducationRecord
} = await import('../../src/features/educationRecords/educationRecordsSlice.js');

const {
  default: academicGoalsReducer,
  fetchAcademicGoal,
  saveAcademicGoal
} = await import('../../src/features/academicGoals/academicGoalsSlice.js');

describe('ResultPoint Analytics, Target CGPA & Report Exports Unit Suite (WP-6)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    tokenStorage.clearSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    tokenStorage.clearSession();
    globalThis.fetch = originalFetch;
  });

  describe('1. Authoritative Academic Reports API (reportApi)', () => {
    it('getPerformanceReport calls GET /api/v1/student/reports/performance with Bearer token', async () => {
      tokenStorage.setSession({ accessToken: 'perf_jwt_token' });
      let requestedUrl = null;
      let requestedHeaders = null;

      globalThis.fetch = async (url, options) => {
        requestedUrl = String(url);
        requestedHeaders = options?.headers;
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              cumulativeCgpa: 8.85,
              estimatedPercentage: 88.5,
              percentageVerificationStatus: 'EXACT',
              totalCreditsAttempted: 88,
              totalCreditsEarned: 88,
              totalPassedSubjects: 22,
              totalFailedSubjects: 0,
              semesterTrends: [
                { semesterNumber: 1, sgpa: 8.5, cumulativeCgpa: 8.5, creditsEarned: 22, creditsAttempted: 22, subjectsPassed: 5, subjectsFailed: 0, resultStatus: 'Passed' },
                { semesterNumber: 2, sgpa: 9.2, cumulativeCgpa: 8.85, creditsEarned: 22, creditsAttempted: 22, subjectsPassed: 5, subjectsFailed: 0, resultStatus: 'Passed' }
              ]
            }
          })
        };
      };

      const report = await reportApi.getPerformanceReport();

      const auth = requestedHeaders?.get ? requestedHeaders.get('Authorization') : requestedHeaders?.['Authorization'];
      assert.strictEqual(requestedUrl, '/api/v1/student/reports/performance');
      assert.strictEqual(auth, 'Bearer perf_jwt_token');
      assert.ok(!requestedUrl.includes('studentId'));
      assert.strictEqual(report.cumulativeCgpa, 8.85);
      assert.strictEqual(report.semesterTrends.length, 2);
    });

    it('getPerformanceReport returns null safely on 404 uninitialized student profile', async () => {
      tokenStorage.setSession({ accessToken: 'valid_token' });
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: false, error: { message: 'Profile not found' } })
      });

      const report = await reportApi.getPerformanceReport();
      assert.strictEqual(report, null);
    });

    it('getBacklogReport calls GET /api/v1/student/reports/backlogs', async () => {
      tokenStorage.setSession({ accessToken: 'backlog_jwt_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              totalBacklogsRecorded: 2,
              activeBacklogsCount: 1,
              clearedBacklogsCount: 1,
              creditsAtRisk: 4,
              backlogs: []
            }
          })
        };
      };

      const res = await reportApi.getBacklogReport();
      assert.strictEqual(requestedUrl, '/api/v1/student/reports/backlogs');
      assert.strictEqual(res.activeBacklogsCount, 1);
    });

    it('getProjectionReport calls GET /api/v1/student/reports/projections', async () => {
      tokenStorage.setSession({ accessToken: 'proj_jwt_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              currentCgpa: 8.2,
              totalCreditsEarned: 44,
              currentSemester: 3,
              remainingSemesters: 3,
              goalProjections: []
            }
          })
        };
      };

      const res = await reportApi.getProjectionReport();
      assert.strictEqual(requestedUrl, '/api/v1/student/reports/projections');
      assert.strictEqual(res.currentCgpa, 8.2);
    });
  });

  describe('2. Official PDF Streamed Export API (exportApi)', () => {
    it('downloadSemesterScorecardPdf validates semester number and calls GET /api/v1/student/results/{sem}/pdf', async () => {
      tokenStorage.setSession({ accessToken: 'pdf_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/pdf' : null },
          blob: async () => new Blob(['%PDF-1.4 dummy scorecard content'], { type: 'application/pdf' })
        };
      };

      await assert.rejects(
        async () => { await exportApi.downloadSemesterScorecardPdf(0); },
        /Valid semester number is required/
      );

      const blob = await exportApi.downloadSemesterScorecardPdf(2);
      assert.strictEqual(requestedUrl, '/api/v1/student/results/2/pdf');
      assert.ok(blob instanceof Blob);
      assert.strictEqual(blob.type, 'application/pdf');
    });

    it('downloadAcademicTranscriptPdf calls GET /api/v1/student/results/history/pdf and streams blob', async () => {
      tokenStorage.setSession({ accessToken: 'pdf_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/pdf' : null },
          blob: async () => new Blob(['%PDF-1.4 transcript content'], { type: 'application/pdf' })
        };
      };

      const blob = await exportApi.downloadAcademicTranscriptPdf();
      assert.strictEqual(requestedUrl, '/api/v1/student/results/history/pdf');
      assert.ok(blob instanceof Blob);
    });

    it('downloadGoalsReportPdf calls GET /api/v1/student/goals/report/pdf and streams blob', async () => {
      tokenStorage.setSession({ accessToken: 'pdf_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/pdf' : null },
          blob: async () => new Blob(['%PDF-1.4 goal report content'], { type: 'application/pdf' })
        };
      };

      const blob = await exportApi.downloadGoalsReportPdf();
      assert.strictEqual(requestedUrl, '/api/v1/student/goals/report/pdf');
      assert.ok(blob instanceof Blob);
    });
  });

  describe('3. Multi-Qualification Education Records API (educationRecordApi)', () => {
    it('normalizeCategoryGroup maps education strings to valid backend enums', () => {
      assert.strictEqual(normalizeCategoryGroup('School Education'), 'SCHOOL');
      assert.strictEqual(normalizeCategoryGroup('Class 10'), 'SCHOOL');
      assert.strictEqual(normalizeCategoryGroup('Class 12'), 'SCHOOL');
      assert.strictEqual(normalizeCategoryGroup('College / Intermediate'), 'COLLEGE');
      assert.strictEqual(normalizeCategoryGroup('University'), 'UNIVERSITY');
      assert.strictEqual(normalizeCategoryGroup('Postgraduate'), 'UNIVERSITY');
    });

    it('normalizeEducationType maps education level to valid backend enum string', () => {
      assert.strictEqual(normalizeEducationType('10th', 'Class 10'), 'CLASS_10');
      assert.strictEqual(normalizeEducationType('12th', 'Class 12'), 'CLASS_12');
      assert.strictEqual(normalizeEducationType('MCA', 'Master of Computer Applications'), 'POSTGRADUATE');
      assert.strictEqual(normalizeEducationType('B.Tech', 'Bachelor of Technology'), 'UNDERGRADUATE');
    });

    it('normalizeEducationRecordDto normalizes backend DTO into frontend shape', () => {
      const backendDto = {
        id: 'edu-101',
        userId: 'user-1',
        type: 'CLASS_10',
        level: 'Class 10',
        categoryGroup: 'SCHOOL',
        boardOrUniversity: 'CBSE',
        institutionName: 'Kendriya Vidyalaya',
        passingYear: 2020,
        academicYear: '2019-2020',
        percentage: 86.4,
        resultStatus: 'COMPLETED',
        subjects: [
          { subjectName: 'Mathematics', subjectCode: 'MATH', marksObtained: 90, maxMarks: 100, grade: 'A1' }
        ]
      };

      const normalized = normalizeEducationRecordDto(backendDto);
      assert.strictEqual(normalized.id, 'edu-101');
      assert.strictEqual(normalized.board, 'CBSE');
      assert.strictEqual(normalized.institutionName, 'Kendriya Vidyalaya');
      assert.strictEqual(normalized.passingYear, 2020);
      assert.strictEqual(normalized.percentage, 86.4);
      assert.strictEqual(normalized.status, 'Completed');
      assert.strictEqual(normalized.subjects.length, 1);
      assert.strictEqual(normalized.subjects[0].name, 'Mathematics');
    });

    it('createEducationRecord validates required fields before submitting to backend', async () => {
      await assert.rejects(
        async () => { await educationRecordApi.createEducationRecord({ institutionName: 'School A', passingYear: 2020 }); },
        /Board or University name is required/
      );

      await assert.rejects(
        async () => { await educationRecordApi.createEducationRecord({ boardOrUniversity: 'CBSE', passingYear: 2020 }); },
        /Institution name is required/
      );

      await assert.rejects(
        async () => { await educationRecordApi.createEducationRecord({ boardOrUniversity: 'CBSE', institutionName: 'School A', passingYear: 1940 }); },
        /Passing year must be valid/
      );
    });

    it('createEducationRecord submits formatted payload to POST /api/v1/student/education-records', async () => {
      tokenStorage.setSession({ accessToken: 'edu_token' });
      let postedBody = null;

      globalThis.fetch = async (url, options) => {
        postedBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 201,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'edu-new',
              type: postedBody.type,
              level: postedBody.level,
              categoryGroup: postedBody.categoryGroup,
              boardOrUniversity: postedBody.boardOrUniversity,
              institutionName: postedBody.institutionName,
              passingYear: postedBody.passingYear,
              percentage: postedBody.percentage,
              resultStatus: postedBody.resultStatus
            }
          })
        };
      };

      const created = await educationRecordApi.createEducationRecord({
        level: 'Class 12',
        boardOrUniversity: 'State Board',
        institutionName: 'Govt Junior College',
        passingYear: 2022,
        percentage: 84.5
      });

      assert.strictEqual(postedBody.type, 'CLASS_12');
      assert.strictEqual(postedBody.boardOrUniversity, 'State Board');
      assert.strictEqual(postedBody.institutionName, 'Govt Junior College');
      assert.strictEqual(postedBody.passingYear, 2022);
      assert.strictEqual(created.id, 'edu-new');
      assert.strictEqual(created.percentage, 84.5);
    });

    it('deleteEducationRecord submits DELETE /api/v1/student/education-records/{id}', async () => {
      tokenStorage.setSession({ accessToken: 'edu_token' });
      let requestedUrl = null;
      let requestedMethod = null;

      globalThis.fetch = async (url, options) => {
        requestedUrl = String(url);
        requestedMethod = options?.method;
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: null })
        };
      };

      const deletedId = await educationRecordApi.deleteEducationRecord('edu-del-123');
      assert.strictEqual(requestedUrl, '/api/v1/student/education-records/edu-del-123');
      assert.strictEqual(requestedMethod, 'DELETE');
      assert.strictEqual(deletedId, 'edu-del-123');
    });
  });

  describe('4. Student Goals & Target CGPA Projections API (goalApi)', () => {
    it('normalizeGoalDto normalizes backend StudentGoalDto', () => {
      const backendDto = {
        id: 'goal-1',
        studentProfileId: 'profile-1',
        targetCgpa: 9.0,
        targetSemester: 6,
        requiredSgpa: 8.85,
        feasibilityStatus: 'FEASIBLE',
        active: true
      };

      const norm = normalizeGoalDto(backendDto);
      assert.strictEqual(norm.id, 'goal-1');
      assert.strictEqual(norm.targetCGPA, 9.0);
      assert.strictEqual(norm.targetSemester, 6);
      assert.strictEqual(norm.requiredSGPA, 8.85);
      assert.strictEqual(norm.feasibilityStatus, 'FEASIBLE');
      assert.strictEqual(norm.active, true);
    });

    it('createGoal validates target CGPA bounds and submits POST /api/v1/student/goals', async () => {
      await assert.rejects(
        async () => { await goalApi.createGoal({ targetCgpa: 12.0 }); },
        /Valid target CGPA between 0.0 and 10.0 is required/
      );

      tokenStorage.setSession({ accessToken: 'goal_token' });
      let requestBody = null;

      globalThis.fetch = async (url, options) => {
        requestBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 201,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'goal-created-1',
              targetCgpa: requestBody.targetCgpa,
              targetSemester: requestBody.targetSemester,
              requiredSgpa: 8.75,
              feasibilityStatus: 'FEASIBLE',
              active: true
            }
          })
        };
      };

      const res = await goalApi.createGoal({ targetCgpa: 8.75, targetSemester: 6 });
      assert.strictEqual(requestBody.targetCgpa, 8.75);
      assert.strictEqual(requestBody.targetSemester, 6);
      assert.strictEqual(res.id, 'goal-created-1');
      assert.strictEqual(res.targetCGPA, 8.75);
    });

    it('updateGoal calls PUT /api/v1/student/goals/{id}', async () => {
      tokenStorage.setSession({ accessToken: 'goal_token' });
      let requestedUrl = null;
      let requestedMethod = null;
      let requestBody = null;

      globalThis.fetch = async (url, options) => {
        requestedUrl = String(url);
        requestedMethod = options?.method;
        requestBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'goal-upd',
              targetCgpa: requestBody.targetCgpa,
              targetSemester: 6,
              active: true
            }
          })
        };
      };

      const res = await goalApi.updateGoal('goal-upd', { targetCgpa: 9.25 });
      assert.strictEqual(requestedUrl, '/api/v1/student/goals/goal-upd');
      assert.strictEqual(requestedMethod, 'PUT');
      assert.strictEqual(requestBody.targetCgpa, 9.25);
      assert.strictEqual(res.targetCGPA, 9.25);
    });
  });

  describe('5. Redux Slices State Lifecycle & Authoritative Reconciliations', () => {
    it('performanceSlice handles fetchPerformanceData.fulfilled and auth/logout cleanly', () => {
      const prevState = {
        overview: null,
        gradeTrends: [],
        loading: true,
        error: null
      };

      const payload = {
        overview: { currentCGPA: 8.85, earnedCredits: 44, totalCredits: 44 },
        gradeTrends: [{ semester: 'Sem 1', sgpa: 8.5 }, { semester: 'Sem 2', sgpa: 9.2 }],
        insights: ['Strong performance in core algorithms'],
        projections: { targetCGPA: 9.0 }
      };

      const nextState = performanceReducer(prevState, {
        type: fetchPerformanceData.fulfilled.type,
        payload
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.overview.currentCGPA, 8.85);
      assert.strictEqual(nextState.gradeTrends.length, 2);

      // auth/logout
      const logoutState = performanceReducer(nextState, { type: 'auth/logout' });
      assert.strictEqual(logoutState.overview, null);
      assert.strictEqual(logoutState.gradeTrends.length, 0);
    });

    it('educationRecordsSlice handles fulfilled actions and auth/logout', () => {
      const prevState = {
        records: [],
        activeEducationId: null,
        loading: true
      };

      const payload = {
        records: [
          { id: 'edu-1', level: 'Class 10', institutionName: 'School A' },
          { id: 'edu-2', level: 'Class 12', institutionName: 'College B' }
        ],
        activeId: 'edu-2'
      };

      const nextState = educationRecordsReducer(prevState, {
        type: fetchEducationRecords.fulfilled.type,
        payload
      });

      assert.strictEqual(nextState.records.length, 2);
      assert.strictEqual(nextState.activeEducationId, 'edu-2');

      const logoutState = educationRecordsReducer(nextState, { type: 'auth/logout' });
      assert.strictEqual(logoutState.records.length, 0);
      assert.strictEqual(logoutState.activeEducationId, null);
    });

    it('academicGoalsSlice handles fulfilled actions and auth/logout', () => {
      const prevState = {
        goal: null,
        metrics: null,
        details: null,
        loading: true
      };

      const payload = {
        goal: { id: 'g1', targetCGPA: 9.0 },
        metrics: { currentCGPA: 8.5, requiredAverageSGPA: 9.5 },
        details: { targetCGPA: 9.0, isFeasible: true }
      };

      const nextState = academicGoalsReducer(prevState, {
        type: fetchAcademicGoal.fulfilled.type,
        payload
      });

      assert.strictEqual(nextState.goal.targetCGPA, 9.0);
      assert.strictEqual(nextState.details.isFeasible, true);

      const logoutState = academicGoalsReducer(nextState, { type: 'auth/logout' });
      assert.strictEqual(logoutState.goal, null);
      assert.strictEqual(logoutState.metrics, null);
      assert.strictEqual(logoutState.details, null);
    });
  });
});
