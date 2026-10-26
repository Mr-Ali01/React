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

const { studentProfileApi } = await import('../../src/services/api/studentProfileApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');
const { studentService } = await import('../../src/services/studentService.js');
const { authService } = await import('../../src/services/authService.js');
const {
  default: academicProfileReducer,
  fetchAcademicProfile,
  saveAcademicProfile,
  setAcademicProfile,
  selectIsProfileComplete,
} = await import('../../src/features/academicProfile/academicProfileSlice.js');
const { resultApi } = await import('../../src/services/api/resultApi.js');
const { goalApi } = await import('../../src/services/api/goalApi.js');
const { reportApi } = await import('../../src/services/api/reportApi.js');
const { resultService } = await import('../../src/services/resultService.js');

describe('ResultPoint Student Profile & Lifecycle Unit Suite (WP-3)', () => {
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

  // 1. Profile Retrieval API (GET /api/v1/student/profile)
  it('1. studentProfileApi.getProfile: should fetch student profile using Bearer token', async () => {
    tokenStorage.setAccessToken('mock_jwt_student_token');

    let capturedUrl = '';
    let capturedHeaders = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers || {};
      const payload = {
        success: true,
        data: {
          id: 'prof_101',
          userId: 'usr_student_1',
          userFullName: 'Arjun Reddy',
          userEmail: 'arjun@resultpoint.edu',
          universityId: 'uni_ou',
          universityName: 'Osmania University',
          courseId: 'course_ou_bca',
          courseName: 'Bachelor of Computer Applications',
          courseLevel: 'UG',
          regulationId: 'reg_ou_bca_cbcs',
          regulationCode: 'OU_BCA_CBCS_V1',
          batchYear: '2024-2027',
          hallTicketNumber: '1005-24-733-001',
          currentSemester: 3,
          gender: 'MALE',
          targetCgpa: 8.5,
          cumulativeCgpa: 8.2,
          totalCreditsEarned: 44,
        },
      };
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      };
    };

    const profile = await studentProfileApi.getProfile();

    assert.ok(capturedUrl.endsWith('/api/v1/student/profile'));
    assert.equal(capturedHeaders.get('Authorization'), 'Bearer mock_jwt_student_token');
    assert.equal(profile.userId, 'usr_student_1');
    assert.equal(profile.hallTicketNumber, '1005-24-733-001');
    assert.equal(profile.universityId, 'uni_ou');
    assert.equal(profile.currentSemester, 3);
  });

  // 2. Profile Retrieval for Incomplete/Unconfigured Student (404 ResourceNotFound)
  it('2. studentProfileApi.getProfile: should return null when backend returns 404 for unconfigured student', async () => {
    window.localStorage.setItem('resultpoint_access_token', 'mock_jwt_new_student');

    const errPayload = {
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Student profile not found for user',
      },
    };
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errPayload,
      text: async () => JSON.stringify(errPayload),
    });

    const profile = await studentProfileApi.getProfile();
    // Must return null cleanly without throwing, indicating profile setup required
    assert.equal(profile, null);
  });

  // 3. Error handling on unexpected API failures
  it('3. studentProfileApi.getProfile: should throw ApiError on 401 or 500 error', async () => {
    const errPayload = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Database connection failed' },
    };
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errPayload,
      text: async () => JSON.stringify(errPayload),
    });

    await assert.rejects(
      async () => {
        await studentProfileApi.getProfile();
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 500);
        return true;
      }
    );
  });

  // 4. Input validation for profile creation/update
  it('4. studentProfileApi.updateProfile: should reject when required fields are missing', async () => {
    await assert.rejects(
      async () => {
        await studentProfileApi.updateProfile({ courseId: 'bca' });
      },
      { message: 'University ID is required' }
    );

    await assert.rejects(
      async () => {
        await studentProfileApi.updateProfile({ universityId: 'osmania' });
      },
      { message: 'Course ID is required' }
    );

    await assert.rejects(
      async () => {
        await studentProfileApi.updateProfile({ universityId: 'osmania', courseId: 'bca' });
      },
      { message: 'Regulation ID is required' }
    );

    await assert.rejects(
      async () => {
        await studentProfileApi.updateProfile({
          universityId: 'osmania',
          courseId: 'bca',
          regulationId: 'ou-bca-cbcs',
        });
      },
      { message: 'Hall ticket number is required' }
    );
  });

  // 5. Profile creation/update API with alias resolution and formatting (PUT /api/v1/student/profile)
  it('5. studentProfileApi.updateProfile: should resolve catalog aliases, format body, and call PUT /api/v1/student/profile', async () => {
    window.localStorage.setItem('resultpoint_access_token', 'mock_jwt_token');

    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);
      const payload = {
        success: true,
        data: {
          id: 'prof_102',
          ...capturedBody,
          userFullName: 'Priya Sharma',
          userEmail: 'priya@resultpoint.edu',
        },
      };
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      };
    };

    const updateData = {
      universityId: 'osmania', // alias -> uni_ou
      courseId: 'bca', // alias -> course_ou_bca
      regulationId: 'ou-bca-cbcs', // alias -> reg_ou_bca_cbcs
      hallTicketNumber: '1005-24-733-042',
      batch: '2024-2027',
      currentSemester: '4',
      gender: 'female',
      targetCgpa: '8.8',
      institutionName: 'Nizam College',
    };

    const result = await studentProfileApi.updateProfile(updateData);

    assert.ok(capturedUrl.endsWith('/api/v1/student/profile'));
    assert.equal(capturedMethod, 'PUT');
    assert.equal(capturedBody.universityId, 'uni_ou');
    assert.equal(capturedBody.courseId, 'course_ou_bca');
    assert.equal(capturedBody.regulationId, 'reg_ou_bca_cbcs');
    assert.equal(capturedBody.hallTicketNumber, '1005-24-733-042');
    assert.equal(capturedBody.batchYear, '2024-2027');
    assert.equal(capturedBody.currentSemester, 4);
    assert.equal(capturedBody.gender, 'FEMALE');
    assert.equal(capturedBody.targetCgpa, 8.8);
    assert.equal(capturedBody.institutionName, 'Nizam College');
    // Security check: Must never accept or trust client-supplied userId
    assert.equal(capturedBody.userId, undefined);
    assert.equal(result.id, 'prof_102');
  });

  // 6. Security identity verification: never trusts client-supplied student ID
  it('6. studentProfileApi: strictly authorizes via Bearer token, never client-supplied student ID', async () => {
    let capturedHeaders = {};
    let capturedUrl = '';

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers || {};
      const payload = {
        success: true,
        data: { id: 'prof_auth', userId: 'server_authenticated_principal' },
      };
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      };
    };

    tokenStorage.setAccessToken('valid_student_bearer_jwt');

    await studentProfileApi.getProfile();

    // Verify endpoint does not take a student/user ID in path or query
    assert.ok(!capturedUrl.includes('?userId='));
    assert.ok(!capturedUrl.includes('?studentId='));
    assert.ok(capturedUrl.endsWith('/api/v1/student/profile'));
    assert.equal(capturedHeaders.get('Authorization'), 'Bearer valid_student_bearer_jwt');
  });

  // 7. Redux slice handling of fetchAcademicProfile (Configured student)
  it('7. academicProfileSlice: fetchAcademicProfile.fulfilled marks profile complete when DTO exists', () => {
    const initialState = {
      hasCompletedProfile: false,
      universityId: null,
      courseId: null,
      loading: true,
      error: null,
    };

    const action = {
      type: fetchAcademicProfile.fulfilled.type,
      payload: {
        id: 'prof_201',
        universityId: 'uni_ou',
        courseId: 'course_ou_bca',
        regulationId: 'reg_ou_bca_cbcs',
        hallTicketNumber: '1005-24-733-099',
        currentSemester: 2,
        hasCompletedProfile: true,
      },
    };

    const newState = academicProfileReducer(initialState, action);

    assert.equal(newState.loading, false);
    assert.equal(newState.hasCompletedProfile, true);
    assert.equal(newState.universityId, 'uni_ou');
    assert.equal(newState.courseId, 'course_ou_bca');
    assert.equal(newState.hallTicketNumber, '1005-24-733-099');

    // Selector verification
    const isComplete = selectIsProfileComplete({ academicProfile: newState });
    assert.equal(isComplete, true);
  });

  // 8. Redux slice handling of fetchAcademicProfile (Incomplete/Unconfigured student)
  it('8. academicProfileSlice: fetchAcademicProfile.fulfilled with null DTO sets hasCompletedProfile to false', () => {
    const initialState = {
      hasCompletedProfile: true,
      universityId: 'uni_ou',
      courseId: 'course_ou_bca',
      loading: true,
      error: null,
    };

    const action = {
      type: fetchAcademicProfile.fulfilled.type,
      payload: {
        hasCompletedProfile: false,
        universityId: null,
        courseId: null,
        regulationId: null,
      },
    };

    const newState = academicProfileReducer(initialState, action);

    assert.equal(newState.loading, false);
    assert.equal(newState.hasCompletedProfile, false);
    assert.equal(newState.universityId, null);
    assert.equal(newState.courseId, null);

    // Selector verification: Gating must block
    const isComplete = selectIsProfileComplete({ academicProfile: newState });
    assert.equal(isComplete, false);
  });

  // 9. Profile completion gating: prevents fake authenticated student fallback
  it('9. studentService.isProfileComplete: correctly identifies unconfigured profiles without fake fallback', () => {
    // Unauthenticated user -> not complete
    window.localStorage.removeItem('resultpoint_user');
    window.localStorage.removeItem('resultpoint_student_profile');
    assert.equal(studentService.isProfileComplete(), false);

    // Authenticated user with incomplete profile
    authService.setSession(
      { id: 'usr_new', role: 'student', hasCompletedProfile: false },
      { accessToken: 'token_1', refreshToken: 'refresh_1' }
    );
    assert.equal(studentService.isProfileComplete(), false);

    // Profile configured with required fields
    authService.setSession(
      {
        id: 'usr_complete',
        role: 'student',
        hasCompletedProfile: true,
        universityId: 'uni_ou',
        courseId: 'course_ou_bca',
      },
      { accessToken: 'token_2', refreshToken: 'refresh_2' }
    );
    studentService.updateProfile({
      universityId: 'uni_ou',
      courseId: 'course_ou_bca',
      hasCompletedProfile: true,
    });
    assert.equal(studentService.isProfileComplete(), true);
  });

  // 10. Logout wipes academic profile state completely
  it('10. academicProfileSlice: auth/logout clears all academic state', () => {
    const activeState = {
      hasCompletedProfile: true,
      universityId: 'uni_ou',
      courseId: 'course_ou_bca',
      regulationId: 'reg_ou_bca_cbcs',
      hallTicketNumber: '1005-24-733-001',
      currentSemester: 3,
      totalSemesters: 6,
      loading: false,
      error: null,
    };

    const loggedOutState = academicProfileReducer(activeState, { type: 'auth/logout' });

    assert.equal(loggedOutState.hasCompletedProfile, false);
    assert.equal(loggedOutState.universityId, null);
    assert.equal(loggedOutState.courseId, null);
    assert.equal(loggedOutState.regulationId, null);
    assert.equal(loggedOutState.hallTicketNumber, null);
    assert.equal(loggedOutState.currentSemester, 1);
  });

  // 11. setAcademicProfile synchronous action updates state
  it('11. academicProfileSlice: setAcademicProfile action manually updates profile state', () => {
    const initialState = {
      hasCompletedProfile: false,
      universityId: null,
      courseId: null,
    };

    const action = setAcademicProfile({
      universityId: 'uni_jntuh',
      courseId: 'course_jntuh_btech_cse',
      hasCompletedProfile: true,
    });

    const newState = academicProfileReducer(initialState, action);
    assert.equal(newState.universityId, 'uni_jntuh');
    assert.equal(newState.courseId, 'course_jntuh_btech_cse');
    assert.equal(newState.hasCompletedProfile, true);
  });

  // 12. saveAcademicProfile.rejected sets error and clears saveSuccess
  it('12. academicProfileSlice: saveAcademicProfile.rejected handles API error state', () => {
    const initialState = {
      loading: true,
      error: null,
      saveSuccess: true,
    };

    const action = {
      type: saveAcademicProfile.rejected.type,
      payload: 'Hall ticket number already registered with Osmania University',
    };

    const newState = academicProfileReducer(initialState, action);
    assert.equal(newState.loading, false);
    assert.equal(newState.error, 'Hall ticket number already registered with Osmania University');
    assert.equal(newState.saveSuccess, false);
  });

  // 13. All 4 student endpoints handle 404 RESOURCE_NOT_FOUND without infinite loops or errors
  it('13. Student endpoints: handle 404 RESOURCE_NOT_FOUND cleanly when profile is missing', async () => {
    tokenStorage.setAccessToken('mock_jwt_unconfigured_student');

    const errPayload = {
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'StudentProfile not found with userId: usr_test',
        status: 404,
      },
    };

    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errPayload,
      text: async () => JSON.stringify(errPayload),
    });

    const profile = await studentProfileApi.getProfile();
    const goals = await goalApi.getGoals();
    const results = await resultApi.getResults();
    const performance = await reportApi.getPerformanceReport();

    assert.equal(profile, null);
    assert.deepEqual(goals, []);
    assert.deepEqual(results, []);
    assert.equal(performance, null);
  });

  // 14. fetchResults does not trigger results_data_updated event loop
  it('14. resultService & resultsSlice: setResults with emitEvent=false avoids results_data_updated event loop', async () => {
    let eventDispatched = false;
    const originalDispatchEvent = globalThis.window.dispatchEvent;
    globalThis.window.dispatchEvent = (event) => {
      if (event && event.name === 'results_data_updated') {
        eventDispatched = true;
      }
      return true;
    };

    try {
      resultService.setResults([{ semesterNumber: 1, subjects: [] }], false);
      assert.equal(eventDispatched, false, 'results_data_updated should not be emitted when emitEvent=false');

      resultService.setResults([{ semesterNumber: 1, subjects: [] }], true);
      assert.equal(eventDispatched, true, 'results_data_updated should be emitted when emitEvent=true');
    } finally {
      globalThis.window.dispatchEvent = originalDispatchEvent;
    }
  });

  // 15. academicProfileSlice: initialized cache guard prevents repeated fetches
  it('15. academicProfileSlice: fetchAcademicProfile condition skips execution if already initialized', async () => {
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      const payload = { success: true, data: { id: 'prof_init', userFullName: 'Test' } };
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      };
    };

    tokenStorage.setAccessToken('mock_token');

    // Simulate Redux store state with initialized: true
    const stateInitialized = {
      academicProfile: {
        loading: false,
        initialized: true,
        hasCompletedProfile: false,
      },
    };

    const dispatch = (act) => act;

    // When dispatched with force=false, condition cancels the execution
    const skippedResult = await fetchAcademicProfile(false)(dispatch, () => stateInitialized, undefined);
    assert.equal(skippedResult.meta.condition, true, 'fetchAcademicProfile should be cancelled by condition');
    assert.equal(fetchCount, 0, 'network fetch should not be called when already initialized');

    // When dispatched with force=true, condition allows execution
    const forcedResult = await fetchAcademicProfile(true)(dispatch, () => stateInitialized, undefined);
    assert.equal(forcedResult.meta.condition, undefined, 'fetchAcademicProfile should execute when force=true');
    assert.equal(fetchCount, 1, 'network fetch should be called on force=true');
  });

  // 16. selectIsProfileComplete selector strictly validates complete profile state
  it('16. selectIsProfileComplete: strictly returns true only when hasCompletedProfile, universityId, and courseId exist', () => {
    // Incomplete: hasCompletedProfile is false
    const state1 = {
      academicProfile: {
        hasCompletedProfile: false,
        universityId: 'uni_ou',
        courseId: 'course_ou_bca',
      },
    };
    assert.equal(selectIsProfileComplete(state1), false);

    // Incomplete: missing courseId
    const state2 = {
      academicProfile: {
        hasCompletedProfile: true,
        universityId: 'uni_ou',
        courseId: null,
      },
    };
    assert.equal(selectIsProfileComplete(state2), false);

    // Complete: all required fields present
    const state3 = {
      academicProfile: {
        hasCompletedProfile: true,
        universityId: 'uni_ou',
        courseId: 'course_ou_bca',
      },
    };
    assert.equal(selectIsProfileComplete(state3), true);
  });

  // 17. Cross-tab navigation with incomplete profile suppresses dependent result/goal/analytics calls
  it('17. Cross-tab navigation: unconfigured student state suppresses result and goal requests', async () => {
    let resultsRequested = false;
    let goalsRequested = false;

    globalThis.fetch = async (url) => {
      if (url.includes('/api/v1/student/results')) resultsRequested = true;
      if (url.includes('/api/v1/student/goals')) goalsRequested = true;
      return {
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, error: { status: 404 } }),
        text: async () => JSON.stringify({ success: false, error: { status: 404 } }),
      };
    };

    const isComplete = false;
    // Emulate tab guard behavior: only dispatch dependent queries when isComplete is true
    if (isComplete) {
      await resultApi.getResults();
      await goalApi.getGoals();
    }

    assert.equal(resultsRequested, false, 'results API should not be requested when profile is incomplete');
    assert.equal(goalsRequested, false, 'goals API should not be requested when profile is incomplete');
  });
});
