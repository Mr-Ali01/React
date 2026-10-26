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

const { resultApi, normalizeSubjectInput, normalizeSemesterResultDto } = await import('../../src/services/api/resultApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');
const { resultService } = await import('../../src/services/resultService.js');
const {
  default: resultsReducer,
  fetchResults,
  addSemesterResult,
  updateSemesterResult,
  deleteSemesterResult,
  setSelectedSemester,
  clearResults
} = await import('../../src/features/results/resultsSlice.js');

describe('ResultPoint Semester Results & Authoritative Calculation Storage Unit Suite (WP-4)', () => {
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

  // 1. Authorization & Identity Security
  it('1. resultApi strictly relies on authenticated Bearer token and never passes client-supplied student/user IDs', async () => {
    tokenStorage.setAccessToken('test-student-jwt-token');

    let capturedUrl = null;
    let capturedHeaders = null;
    let capturedBody = null;

    globalThis.fetch = async (url, options = {}) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      capturedBody = options.body ? JSON.parse(options.body) : null;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: [],
          message: 'Success',
          timestamp: new Date().toISOString()
        })
      };
    };

    await resultApi.getResults();

    const authHeader = capturedHeaders instanceof Headers
      ? capturedHeaders.get('Authorization')
      : capturedHeaders?.Authorization;

    assert.equal(capturedUrl, '/api/v1/student/results');
    assert.equal(authHeader, 'Bearer test-student-jwt-token');
    assert.equal(capturedUrl.includes('userId'), false);
    assert.equal(capturedUrl.includes('studentProfileId'), false);
  });

  // 2. normalizeSubjectInput formatting
  it('2. normalizeSubjectInput properly formats subject attributes, preserving OU BCA/MCA S grade and credits', () => {
    const inputSubject = {
      code: 'CS401',
      name: 'Machine Learning & AI',
      credits: 4,
      grade: 'S',
      points: 10,
      marksObtained: 92,
      maxMarks: 100
    };

    const normalized = normalizeSubjectInput(inputSubject);

    assert.equal(normalized.subjectCode, 'CS401');
    assert.equal(normalized.subjectName, 'Machine Learning & AI');
    assert.equal(normalized.credits, 4);
    assert.equal(normalized.gradeLetter, 'S');
    assert.equal(normalized.gradePoints, 10);
    assert.equal(normalized.externalMarks, 92);
    assert.equal(normalized.internalMarks, 0);
    assert.equal(normalized.maxMarks, 100);
  });

  // 3. resultApi.getResults retrieval & normalization
  it('3. resultApi.getResults retrieves semester scorecards and normalizes backend calculation values', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    const mockBackendDto = [
      {
        id: 'sem_res_001',
        studentProfileId: 'prof_123',
        semesterNumber: 1,
        academicPeriod: 'Dec 2025 Regular',
        totalCredits: 20.0,
        creditsEarned: 20.0,
        sgpa: 8.65,
        cgpa: 8.65,
        equivalentPercentage: 86.5,
        standingStatus: 'First Class with Distinction',
        ruleVersionSnapshot: '1.0',
        subjects: [
          {
            id: 'sub_res_001',
            subjectCode: 'CS101',
            subjectName: 'Programming in C',
            credits: 4.0,
            gradeLetter: 'S',
            gradePoints: 10.0,
            internalMarks: 28.0,
            externalMarks: 65.0,
            totalMarks: 93.0,
            isPass: true
          }
        ]
      }
    ];

    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: mockBackendDto,
        message: 'Success',
        timestamp: new Date().toISOString()
      })
    });

    const results = await resultApi.getResults();

    assert.equal(results.length, 1);
    const sem1 = results[0];
    assert.equal(sem1.id, 'sem_res_001');
    assert.equal(sem1.semesterNumber, 1);
    assert.equal(sem1.academicPeriod, 'Dec 2025 Regular');
    assert.equal(sem1.sgpa, 8.65);
    assert.equal(sem1.cgpa, 8.65);
    assert.equal(sem1.totalCredits, 20);
    assert.equal(sem1.creditsEarned, 20);
    assert.equal(sem1.standingStatus, 'First Class with Distinction');
    assert.equal(sem1.subjects.length, 1);
    assert.equal(sem1.subjects[0].code, 'CS101');
    assert.equal(sem1.subjects[0].grade, 'S');
    assert.equal(sem1.subjects[0].points, 10);
    assert.equal(sem1.subjects[0].isPass, true);
  });

  // 4. resultApi.getResultBySemester
  it('4. resultApi.getResultBySemester calls GET /api/v1/student/results/{semesterNumber} and validates inputs', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    let requestedPath = null;
    globalThis.fetch = async (url) => {
      requestedPath = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            id: 'sem_res_002',
            semesterNumber: 2,
            academicPeriod: 'May 2026',
            totalCredits: 22.0,
            creditsEarned: 22.0,
            sgpa: 9.10,
            cgpa: 8.88,
            standingStatus: 'First Class with Distinction',
            subjects: []
          }
        })
      };
    };

    const res = await resultApi.getResultBySemester(2);
    assert.equal(requestedPath, '/api/v1/student/results/2');
    assert.equal(res.semesterNumber, 2);
    assert.equal(res.sgpa, 9.10);
    assert.equal(res.cgpa, 8.88);

    await assert.rejects(
      async () => resultApi.getResultBySemester('invalid'),
      /Invalid semester number/
    );
  });

  // 5. resultApi.saveResult contract validation & submission
  it('5. resultApi.saveResult validates payload and submits POST /api/v1/student/results', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    let sentMethod = null;
    let sentUrl = null;
    let sentBody = null;

    globalThis.fetch = async (url, options = {}) => {
      sentMethod = options.method;
      sentUrl = url;
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            id: 'sem_res_created',
            semesterNumber: 1,
            academicPeriod: 'Fall 2026',
            totalCredits: 20.0,
            creditsEarned: 20.0,
            sgpa: 8.90,
            cgpa: 8.90,
            standingStatus: 'First Class with Distinction',
            subjects: []
          }
        })
      };
    };

    const payload = {
      semesterNumber: 1,
      academicPeriod: 'Fall 2026',
      subjects: [
        { code: 'CS101', name: 'Programming in C', credits: 4, grade: 'S', points: 10 }
      ]
    };

    const created = await resultApi.saveResult(payload);

    assert.equal(sentMethod, 'POST');
    assert.equal(sentUrl, '/api/v1/student/results');
    assert.equal(sentBody.semesterNumber, 1);
    assert.equal(sentBody.academicPeriod, 'Fall 2026');
    assert.equal(sentBody.subjects.length, 1);
    assert.equal(sentBody.subjects[0].subjectCode, 'CS101');
    assert.equal(sentBody.subjects[0].gradeLetter, 'S');
    assert.equal(created.sgpa, 8.90);
    assert.equal(created.cgpa, 8.90);
  });

  // 6. resultApi.updateResult submits PUT /api/v1/student/results/{semesterNumber}
  it('6. resultApi.updateResult submits PUT /api/v1/student/results/{semesterNumber} with updated scorecard', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    let sentMethod = null;
    let sentUrl = null;
    let sentBody = null;

    globalThis.fetch = async (url, options = {}) => {
      sentMethod = options.method;
      sentUrl = url;
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            id: 'sem_res_updated',
            semesterNumber: 2,
            academicPeriod: 'May 2026 Regular',
            totalCredits: 22.0,
            creditsEarned: 22.0,
            sgpa: 9.35,
            cgpa: 9.12,
            standingStatus: 'First Class with Distinction',
            subjects: []
          }
        })
      };
    };

    const updatePayload = {
      semesterNumber: 2,
      academicPeriod: 'May 2026 Regular',
      subjects: [
        { code: 'CS201', name: 'Data Structures', credits: 4, grade: 'S', points: 10 },
        { code: 'CS202', name: 'DBMS', credits: 4, grade: 'A+', points: 9 }
      ]
    };

    const updated = await resultApi.updateResult(2, updatePayload);

    assert.equal(sentMethod, 'PUT');
    assert.equal(sentUrl, '/api/v1/student/results/2');
    assert.equal(sentBody.semesterNumber, 2);
    assert.equal(sentBody.academicPeriod, 'May 2026 Regular');
    assert.equal(sentBody.subjects.length, 2);
    assert.equal(updated.sgpa, 9.35);
    assert.equal(updated.cgpa, 9.12);
  });

  // 7. resultApi.deleteResult calls DELETE /api/v1/student/results/{semesterNumber}
  it('7. resultApi.deleteResult submits DELETE /api/v1/student/results/{semesterNumber}', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    let sentMethod = null;
    let sentUrl = null;

    globalThis.fetch = async (url, options = {}) => {
      sentMethod = options.method;
      sentUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: null,
          message: 'Semester result deleted successfully'
        })
      };
    };

    const deletedSem = await resultApi.deleteResult(3);

    assert.equal(sentMethod, 'DELETE');
    assert.equal(sentUrl, '/api/v1/student/results/3');
    assert.equal(deletedSem, 3);
  });

  // 8. resultApi.getAcademicHistory retrieval & progression mapping
  it('8. resultApi.getAcademicHistory retrieves student academic history and progression summary', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: {
          summary: {
            totalSemestersRecorded: 2,
            cumulativeCgpa: 8.75,
            totalCreditsEarned: 42.0,
            activeBacklogsCount: 0,
            clearedBacklogsCount: 0,
            currentAcademicStanding: 'First Class with Distinction'
          },
          history: [
            {
              id: 'sem_1',
              semesterNumber: 1,
              academicPeriod: 'Fall 2025',
              sgpa: 8.50,
              cgpa: 8.50,
              totalCredits: 20,
              creditsEarned: 20,
              subjects: []
            },
            {
              id: 'sem_2',
              semesterNumber: 2,
              academicPeriod: 'Spring 2026',
              sgpa: 9.00,
              cgpa: 8.75,
              totalCredits: 22,
              creditsEarned: 22,
              subjects: []
            }
          ]
        }
      })
    });

    const historyData = await resultApi.getAcademicHistory();

    assert.equal(historyData.summary.totalSemestersRecorded, 2);
    assert.equal(historyData.summary.cumulativeCgpa, 8.75);
    assert.equal(historyData.history.length, 2);
    assert.equal(historyData.history[0].semesterNumber, 1);
    assert.equal(historyData.history[1].semesterNumber, 2);
  });

  // 9. Error handling: Backend 400 Bad Request duplicate semester
  it('9. resultApi handles duplicate semester 400 error without false success', async () => {
    tokenStorage.setAccessToken('valid-jwt');

    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        status: 400,
        error: 'BAD_REQUEST',
        message: 'Semester result for semester 1 already exists. Use PUT to update.'
      })
    });

    await assert.rejects(
      async () => resultApi.saveResult({
        semesterNumber: 1,
        academicPeriod: 'Fall 2026',
        subjects: [{ code: 'CS101', name: 'Prog', credits: 4 }]
      }),
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert(err.message.includes('already exists. Use PUT to update'));
        return true;
      }
    );
  });

  // 10. Redux resultsSlice: addSemesterResult stores authoritative backend calculation
  it('10. resultsSlice addSemesterResult.fulfilled integrates authoritative calculations without frontend arithmetic overwrite', () => {
    const initialState = {
      results: [],
      selectedSemester: 1,
      selectedResult: null,
      loading: false,
      error: null,
      operationSuccess: false,
    };

    const authoritativeSavedResult = {
      id: 'sem_res_backend_001',
      semesterNumber: 1,
      semesterLabel: 'Semester 1',
      academicPeriod: 'Dec 2025',
      sgpa: 9.45,
      cgpa: 9.45,
      totalCredits: 22,
      creditsEarned: 22,
      standingStatus: 'First Class with Distinction',
      subjects: [
        { code: 'CS101', name: 'Prog C', credits: 4, grade: 'S', points: 10, isPass: true }
      ]
    };

    const action = {
      type: addSemesterResult.fulfilled.type,
      payload: authoritativeSavedResult
    };

    const state = resultsReducer(initialState, action);

    assert.equal(state.results.length, 1);
    assert.equal(state.results[0].sgpa, 9.45);
    assert.equal(state.results[0].cgpa, 9.45);
    assert.equal(state.results[0].standingStatus, 'First Class with Distinction');
    assert.equal(state.selectedSemester, 1);
    assert.equal(state.selectedResult.id, 'sem_res_backend_001');
    assert.equal(state.operationSuccess, true);
  });

  // 11. Redux resultsSlice: updateSemesterResult re-evaluates and maintains ascending sort
  it('11. resultsSlice updateSemesterResult.fulfilled updates existing semester and maintains chronological order', () => {
    const existingState = {
      results: [
        { id: 'sem_1', semesterNumber: 1, sgpa: 8.0, cgpa: 8.0 },
        { id: 'sem_2', semesterNumber: 2, sgpa: 8.5, cgpa: 8.25 }
      ],
      selectedSemester: 1,
      selectedResult: null,
      loading: false,
      error: null,
      operationSuccess: false,
    };

    const updatedSem1 = {
      id: 'sem_1',
      semesterNumber: 1,
      sgpa: 8.75, // Updated SGPA from backend
      cgpa: 8.75,
      standingStatus: 'First Class with Distinction'
    };

    const action = {
      type: updateSemesterResult.fulfilled.type,
      payload: updatedSem1
    };

    const state = resultsReducer(existingState, action);

    assert.equal(state.results.length, 2);
    assert.equal(state.results[0].semesterNumber, 1);
    assert.equal(state.results[0].sgpa, 8.75);
    assert.equal(state.results[1].semesterNumber, 2);
    assert.equal(state.operationSuccess, true);
  });

  // 12. Redux resultsSlice: deleteSemesterResult removes record from store
  it('12. resultsSlice deleteSemesterResult.fulfilled cleanly removes deleted semester scorecard', () => {
    const existingState = {
      results: [
        { id: 'sem_1', semesterNumber: 1, sgpa: 8.0, cgpa: 8.0 },
        { id: 'sem_2', semesterNumber: 2, sgpa: 8.5, cgpa: 8.25 }
      ],
      selectedSemester: 2,
      selectedResult: { id: 'sem_2', semesterNumber: 2 },
      loading: false,
      error: null,
      operationSuccess: false,
    };

    const action = {
      type: deleteSemesterResult.fulfilled.type,
      payload: 'sem_2'
    };

    const state = resultsReducer(existingState, action);

    assert.equal(state.results.length, 1);
    assert.equal(state.results[0].semesterNumber, 1);
    assert.equal(state.selectedResult, null);
    assert.equal(state.operationSuccess, true);
  });

  // 13. Redux resultsSlice: auth/logout clears all semester results
  it('13. resultsSlice handles auth/logout action by purging results state', () => {
    const existingState = {
      results: [
        { id: 'sem_1', semesterNumber: 1, sgpa: 8.0, cgpa: 8.0 }
      ],
      selectedSemester: 1,
      selectedResult: { id: 'sem_1' },
      loading: false,
      error: null,
      operationSuccess: true,
    };

    const action = { type: 'auth/logout' };
    const state = resultsReducer(existingState, action);

    assert.deepEqual(state.results, []);
    assert.equal(state.selectedResult, null);
    assert.equal(state.selectedSemester, 1);
    assert.equal(state.operationSuccess, false);
  });
});
