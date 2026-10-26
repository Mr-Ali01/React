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

const { backlogApi, normalizeBacklogDto } = await import('../../src/services/api/backlogApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');
const { backlogService } = await import('../../src/services/backlogService.js');
const {
  default: backlogReducer,
  fetchBacklogs,
  markBacklogCleared,
  setSelectedBacklog,
  clearBacklogError,
  resetBacklogsState
} = await import('../../src/features/backlog/backlogSlice.js');

describe('ResultPoint Student Backlog Tracking & Clearance Lifecycle Suite (WP-5)', () => {
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

  describe('1. Authoritative Backend Contract & Normalization (normalizeBacklogDto)', () => {
    it('returns null when given nullish or undefined backend DTO', () => {
      assert.strictEqual(normalizeBacklogDto(null), null);
      assert.strictEqual(normalizeBacklogDto(undefined), null);
    });

    it('correctly maps ACTIVE backend DTO to frontend Active backlog format', () => {
      const backendDto = {
        id: 'backlog-uuid-101',
        studentProfileId: 'profile-uuid-001',
        subjectCode: 'CS301',
        subjectName: 'Design and Analysis of Algorithms',
        semesterNumber: 3,
        credits: 4,
        status: 'ACTIVE',
        clearedInPeriod: null,
        clearedGrade: null,
        clearedAt: null,
        createdAt: '2026-03-15T10:00:00Z',
        updatedAt: '2026-03-15T10:00:00Z'
      };

      const normalized = normalizeBacklogDto(backendDto);
      assert.strictEqual(normalized.id, 'backlog-uuid-101');
      assert.strictEqual(normalized.studentProfileId, 'profile-uuid-001');
      assert.strictEqual(normalized.subjectCode, 'CS301');
      assert.strictEqual(normalized.subjectName, 'Design and Analysis of Algorithms');
      assert.strictEqual(normalized.semesterNumber, 3);
      assert.strictEqual(normalized.semesterLabel, 'Semester 3');
      assert.strictEqual(normalized.credits, 4);
      assert.strictEqual(normalized.status, 'Active');
      assert.strictEqual(normalized.backendStatus, 'ACTIVE');
      assert.strictEqual(normalized.clearedGrade, null);
      assert.strictEqual(normalized.clearedAt, null);
    });

    it('correctly maps CLEARED backend DTO to frontend Cleared backlog format with clearance metadata', () => {
      const backendDto = {
        id: 'backlog-uuid-102',
        studentProfileId: 'profile-uuid-001',
        subjectCode: 'MA201',
        subjectName: 'Discrete Mathematics',
        semesterNumber: 2,
        credits: 3,
        status: 'CLEARED',
        clearedInPeriod: 'Supplementary Exam (July 2026)',
        clearedGrade: 'B',
        clearedAt: '2026-07-20T14:30:00Z',
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-07-20T14:30:00Z'
      };

      const normalized = normalizeBacklogDto(backendDto);
      assert.strictEqual(normalized.id, 'backlog-uuid-102');
      assert.strictEqual(normalized.subjectCode, 'MA201');
      assert.strictEqual(normalized.status, 'Cleared');
      assert.strictEqual(normalized.backendStatus, 'CLEARED');
      assert.strictEqual(normalized.clearedInPeriod, 'Supplementary Exam (July 2026)');
      assert.strictEqual(normalized.clearedGrade, 'B');
      assert.strictEqual(normalized.clearedAt, '2026-07-20T14:30:00Z');
      assert.strictEqual(normalized.clearedInSemester, 2);
    });

    it('falls back to safe defaults when optional DTO fields are missing', () => {
      const sparseDto = {
        id: 'sparse-1',
        subjectCode: 'EC101',
        status: 'ACTIVE'
      };

      const normalized = normalizeBacklogDto(sparseDto);
      assert.strictEqual(normalized.subjectName, 'EC101');
      assert.strictEqual(normalized.semesterNumber, 1);
      assert.strictEqual(normalized.credits, 4);
      assert.strictEqual(normalized.status, 'Active');
    });
  });

  describe('2. Backend Backlog API Client (backlogApi)', () => {
    it('GET /api/v1/student/backlogs transmits Bearer token and does not transmit client-supplied user IDs', async () => {
      tokenStorage.setSession({
        accessToken: 'student_jwt_backlog_token_xyz',
        user: { id: 'client_id_ignore', username: 'student1' }
      });

      let requestedUrl = null;
      let requestedHeaders = null;

      globalThis.fetch = async (url, options) => {
        requestedUrl = String(url);
        requestedHeaders = options?.headers || {};
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: [
              {
                id: 'b1',
                subjectCode: 'CS101',
                subjectName: 'Programming in C',
                semesterNumber: 1,
                credits: 4,
                status: 'ACTIVE'
              }
            ]
          })
        };
      };

      const backlogs = await backlogApi.getBacklogs();

      const authHeader = requestedHeaders?.get ? requestedHeaders.get('Authorization') : requestedHeaders?.['Authorization'];
      assert.strictEqual(requestedUrl, '/api/v1/student/backlogs');
      assert.strictEqual(authHeader, 'Bearer student_jwt_backlog_token_xyz');
      assert.ok(!requestedUrl.includes('studentId'));
      assert.ok(!requestedUrl.includes('client_id_ignore'));
      assert.strictEqual(backlogs.length, 1);
      assert.strictEqual(backlogs[0].subjectCode, 'CS101');
      assert.strictEqual(backlogs[0].status, 'Active');
    });

    it('GET /api/v1/student/backlogs supports status filter query parameter', async () => {
      tokenStorage.setSession({ accessToken: 'valid_token' });
      let requestedUrl = null;

      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: []
          })
        };
      };

      await backlogApi.getBacklogs('ACTIVE');
      assert.strictEqual(requestedUrl, '/api/v1/student/backlogs?status=ACTIVE');

      await backlogApi.getBacklogs('CLEARED');
      assert.strictEqual(requestedUrl, '/api/v1/student/backlogs?status=CLEARED');
    });

    it('GET /api/v1/student/backlogs returns empty array on 404 or 401 uninitialized response', async () => {
      tokenStorage.setSession({ accessToken: 'valid_token' });

      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: false,
          error: { message: 'No backlogs or profile found' }
        })
      });

      const res = await backlogApi.getBacklogs();
      assert.deepStrictEqual(res, []);
    });

    it('GET /api/v1/student/backlogs throws ApiError on 500 server error', async () => {
      tokenStorage.setSession({ accessToken: 'valid_token' });

      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: false,
          error: { message: 'Internal database error' }
        })
      });

      await assert.rejects(
        async () => { await backlogApi.getBacklogs(); },
        (err) => err instanceof ApiError && err.status === 500
      );
    });

    it('POST /api/v1/student/backlogs/clear validates required fields before making request', async () => {
      await assert.rejects(
        async () => { await backlogApi.clearBacklog({ clearedInPeriod: 'Supp 2026', clearedGrade: 'B' }); },
        /Backlog ID is required/
      );

      await assert.rejects(
        async () => { await backlogApi.clearBacklog({ backlogId: 'b1', clearedGrade: 'B' }); },
        /Cleared academic period is required/
      );

      await assert.rejects(
        async () => { await backlogApi.clearBacklog({ backlogId: 'b1', clearedInPeriod: 'Supp 2026' }); },
        /Cleared grade letter is required/
      );
    });

    it('POST /api/v1/student/backlogs/clear sends exact backend request payload and normalizes response', async () => {
      tokenStorage.setSession({ accessToken: 'jwt_clear_token' });

      let requestMethod = null;
      let requestBody = null;

      globalThis.fetch = async (url, options) => {
        requestMethod = options?.method;
        requestBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'backlog-101',
              studentProfileId: 'profile-1',
              subjectCode: 'CS202',
              subjectName: 'Operating Systems',
              semesterNumber: 4,
              credits: 4,
              status: 'CLEARED',
              clearedInPeriod: 'Supplementary Exam Nov 2026',
              clearedGrade: 'A',
              clearedAt: '2026-11-20T10:00:00Z',
              createdAt: '2026-05-10T10:00:00Z',
              updatedAt: '2026-11-20T10:00:00Z'
            }
          })
        };
      };

      const result = await backlogApi.clearBacklog({
        backlogId: 'backlog-101',
        clearedInPeriod: 'Supplementary Exam Nov 2026',
        clearedGrade: 'a'
      });

      assert.strictEqual(requestMethod, 'POST');
      assert.strictEqual(requestBody.backlogId, 'backlog-101');
      assert.strictEqual(requestBody.clearedInPeriod, 'Supplementary Exam Nov 2026');
      assert.strictEqual(requestBody.clearedGrade, 'A'); // Normalized uppercase

      assert.strictEqual(result.id, 'backlog-101');
      assert.strictEqual(result.status, 'Cleared');
      assert.strictEqual(result.backendStatus, 'CLEARED');
      assert.strictEqual(result.clearedGrade, 'A');
    });
  });

  describe('3. Authoritative Synchronization via backlogService', () => {
    it('setBacklogs stores normalized list and updates state', () => {
      const items = [
        { id: 'b1', subjectCode: 'CS101', semesterNumber: 1, status: 'Active', credits: 4 },
        { id: 'b2', subjectCode: 'MA101', semesterNumber: 1, status: 'Cleared', credits: 4, clearedGrade: 'B' }
      ];

      backlogService.setBacklogs(items);
      const retrieved = backlogService.getBacklogs();

      assert.strictEqual(retrieved.length, 2);
      assert.strictEqual(retrieved[0].id, 'b1');
      assert.strictEqual(retrieved[1].status, 'Cleared');
    });

    it('syncBacklogAuthoritative merges authoritative cleared DTO and recomputes summary metrics', () => {
      const initial = [
        { id: 'b1', subjectCode: 'CS101', semesterNumber: 1, status: 'Active', credits: 4 },
        { id: 'b2', subjectCode: 'MA101', semesterNumber: 1, status: 'Active', credits: 4 }
      ];
      backlogService.setBacklogs(initial);

      const clearedDto = {
        id: 'b1',
        subjectCode: 'CS101',
        semesterNumber: 1,
        credits: 4,
        status: 'Cleared',
        clearedGrade: 'A',
        clearedInPeriod: 'Supplementary (Nov 2026)'
      };

      const updatedSummary = backlogService.syncBacklogAuthoritative(clearedDto);

      assert.strictEqual(updatedSummary.totalBacklogs, 2);
      assert.strictEqual(updatedSummary.activeBacklogs, 1);
      assert.strictEqual(updatedSummary.clearedBacklogs, 1);
      assert.strictEqual(updatedSummary.clearanceRate, 50);
      assert.strictEqual(updatedSummary.clearanceStatus, '1 Active');

      const currentList = backlogService.getBacklogs();
      const b1 = currentList.find((b) => b.id === 'b1');
      assert.strictEqual(b1.status, 'Cleared');
      assert.strictEqual(b1.clearedGrade, 'A');
    });

    it('scanBacklogs correctly identifies failed subjects from semester results as active backlogs', () => {
      const mockResults = [
        {
          id: 'sem-1',
          semesterNumber: 1,
          semesterLabel: 'Semester 1',
          subjects: [
            { code: 'MATH1', name: 'Mathematics I', credits: 4, grade: 'A', points: 9, isPass: true },
            { code: 'PHY1', name: 'Physics I', credits: 4, grade: 'F', points: 0, isPass: false }
          ]
        },
        {
          id: 'sem-2',
          semesterNumber: 2,
          semesterLabel: 'Semester 2',
          subjects: [
            { code: 'CHEM1', name: 'Chemistry', credits: 3, grade: 'F', points: 0, isPass: false }
          ]
        }
      ];

      const scanResult = backlogService.scanBacklogs(mockResults);
      assert.strictEqual(scanResult.totalBacklogs, 2);
      assert.strictEqual(scanResult.activeBacklogs, 2);
      assert.strictEqual(scanResult.clearedBacklogs, 0);
      assert.strictEqual(scanResult.clearanceRate, 0);
      assert.strictEqual(scanResult.clearanceStatus, '2 Active');

      const codes = scanResult.backlogs.map((b) => b.subjectCode);
      assert.ok(codes.includes('PHY1'));
      assert.ok(codes.includes('CHEM1'));
    });
  });

  describe('4. Redux Backlog Slice Reducers & Authoritative State Lifecycle', () => {
    it('fetchBacklogs.fulfilled sets backlogs and computes exact summary metrics', () => {
      const prevState = {
        backlogs: [],
        totalBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        clearanceRate: 100,
        clearanceStatus: 'All Clear',
        loading: true,
        error: null
      };

      const payload = {
        backlogs: [
          { id: 'b1', subjectCode: 'CS1', status: 'Active' },
          { id: 'b2', subjectCode: 'CS2', status: 'Cleared' },
          { id: 'b3', subjectCode: 'CS3', status: 'Cleared' }
        ],
        totalBacklogs: 3,
        activeBacklogs: 1,
        clearedBacklogs: 2,
        clearanceRate: 67,
        clearanceStatus: '1 Active'
      };

      const nextState = backlogReducer(prevState, {
        type: fetchBacklogs.fulfilled.type,
        payload
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.backlogs.length, 3);
      assert.strictEqual(nextState.totalBacklogs, 3);
      assert.strictEqual(nextState.activeBacklogs, 1);
      assert.strictEqual(nextState.clearedBacklogs, 2);
      assert.strictEqual(nextState.clearanceRate, 67);
      assert.strictEqual(nextState.clearanceStatus, '1 Active');
    });

    it('fetchBacklogs.rejected captures error and resets loading flag', () => {
      const prevState = { loading: true, error: null };
      const nextState = backlogReducer(prevState, {
        type: fetchBacklogs.rejected.type,
        payload: 'Unable to reach backend backlog service'
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.error, 'Unable to reach backend backlog service');
    });

    it('markBacklogCleared.fulfilled updates the authoritative state when a backlog is cleared', () => {
      const prevState = {
        backlogs: [
          { id: 'b1', subjectCode: 'CS1', status: 'Active' },
          { id: 'b2', subjectCode: 'CS2', status: 'Active' }
        ],
        totalBacklogs: 2,
        activeBacklogs: 2,
        clearedBacklogs: 0,
        clearanceRate: 0,
        clearanceStatus: '2 Active',
        loading: true
      };

      const payload = {
        backlogs: [
          { id: 'b1', subjectCode: 'CS1', status: 'Cleared', clearedGrade: 'B' },
          { id: 'b2', subjectCode: 'CS2', status: 'Active' }
        ],
        totalBacklogs: 2,
        activeBacklogs: 1,
        clearedBacklogs: 1,
        clearanceRate: 50,
        clearanceStatus: '1 Active'
      };

      const nextState = backlogReducer(prevState, {
        type: markBacklogCleared.fulfilled.type,
        payload
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.activeBacklogs, 1);
      assert.strictEqual(nextState.clearedBacklogs, 1);
      assert.strictEqual(nextState.clearanceRate, 50);
      assert.strictEqual(nextState.backlogs[0].status, 'Cleared');
    });

    it('auth/logout resets all backlog state to clean initial defaults', () => {
      const stateWithBacklogs = {
        backlogs: [{ id: 'b1', subjectCode: 'CS1' }],
        totalBacklogs: 1,
        activeBacklogs: 1,
        clearedBacklogs: 0,
        clearanceRate: 0,
        clearanceStatus: '1 Active',
        selectedBacklog: { id: 'b1' },
        loading: false,
        error: 'Some past error'
      };

      const nextState = backlogReducer(stateWithBacklogs, { type: 'auth/logout' });

      assert.deepStrictEqual(nextState.backlogs, []);
      assert.strictEqual(nextState.totalBacklogs, 0);
      assert.strictEqual(nextState.activeBacklogs, 0);
      assert.strictEqual(nextState.clearedBacklogs, 0);
      assert.strictEqual(nextState.clearanceRate, 100);
      assert.strictEqual(nextState.clearanceStatus, 'All Clear');
      assert.strictEqual(nextState.selectedBacklog, null);
      assert.strictEqual(nextState.error, null);
    });

    it('resetBacklogsState action resets all backlog state to clean defaults', () => {
      const stateWithBacklogs = {
        backlogs: [{ id: 'b1' }],
        totalBacklogs: 1,
        activeBacklogs: 1,
        clearedBacklogs: 0,
        clearanceRate: 0,
        clearanceStatus: '1 Active',
        loading: false,
        error: null
      };

      const nextState = backlogReducer(stateWithBacklogs, resetBacklogsState());
      assert.strictEqual(nextState.totalBacklogs, 0);
      assert.strictEqual(nextState.backlogs.length, 0);
      assert.strictEqual(nextState.clearanceStatus, 'All Clear');
    });

    it('reconciles state when semester result lifecycle actions are fulfilled', () => {
      const mockResult = {
        id: 'sem-1',
        semesterNumber: 1,
        subjects: [
          { code: 'MATH101', name: 'Math', credits: 4, grade: 'F', points: 0, isPass: false }
        ]
      };

      // Put result in localStorage so scan reflects it
      window.localStorage.setItem('resultpoint_results', JSON.stringify([mockResult]));

      const prevState = {
        backlogs: [],
        totalBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        clearanceRate: 100,
        clearanceStatus: 'All Clear'
      };

      // Trigger addSemesterResult.fulfilled
      const stateAfterAdd = backlogReducer(prevState, {
        type: 'results/addSemesterResult/fulfilled',
        payload: mockResult
      });

      assert.strictEqual(stateAfterAdd.totalBacklogs, 1);
      assert.strictEqual(stateAfterAdd.activeBacklogs, 1);
      assert.strictEqual(stateAfterAdd.clearanceStatus, '1 Active');
    });
  });
});
