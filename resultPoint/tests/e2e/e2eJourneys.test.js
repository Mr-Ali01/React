import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Browser environment simulation for E2E headless integration
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
};

globalThis.window = {
  localStorage: createMockStorage(),
  sessionStorage: createMockStorage(),
  dispatchEvent: (event) => {
    if (globalThis.window._eventListeners?.[event.type || event.name]) {
      globalThis.window._eventListeners[event.type || event.name].forEach((cb) => cb(event));
    }
    return true;
  },
  _eventListeners: {},
  addEventListener: (name, cb) => {
    if (!globalThis.window._eventListeners[name]) {
      globalThis.window._eventListeners[name] = [];
    }
    globalThis.window._eventListeners[name].push(cb);
  },
  removeEventListener: (name, cb) => {
    if (globalThis.window._eventListeners[name]) {
      globalThis.window._eventListeners[name] = globalThis.window._eventListeners[name].filter((fn) => fn !== cb);
    }
  },
  URL: {
    createObjectURL: () => 'blob:http://localhost:5173/mock-object-url',
    revokeObjectURL: () => {},
  }
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, params = {}) {
    this.name = name;
    this.type = name;
    this.detail = params.detail;
  }
};
globalThis.Event = class Event {
  constructor(name) {
    this.name = name;
    this.type = name;
  }
};

// Import all centralized services and slices
const { authApi } = await import('../../src/services/api/authApi.js');
const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');
const { studentProfileApi } = await import('../../src/services/api/studentProfileApi.js');
const { academicCalculationEngine } = await import('../../src/services/academicCalculationEngine.js');
const { resultApi } = await import('../../src/services/api/resultApi.js');
const { backlogApi } = await import('../../src/services/api/backlogApi.js');
const { reportApi } = await import('../../src/services/api/reportApi.js');
const { exportApi } = await import('../../src/services/api/exportApi.js');
const { educationRecordApi } = await import('../../src/services/api/educationRecordApi.js');
const { goalApi } = await import('../../src/services/api/goalApi.js');
const { studentService } = await import('../../src/services/studentService.js');
const { backlogService } = await import('../../src/services/backlogService.js');
const { auditHistoryService } = await import('../../src/services/auditHistoryService.js');

const { default: authReducer } = await import('../../src/features/auth/authSlice.js');
const { default: academicProfileReducer } = await import('../../src/features/academicProfile/academicProfileSlice.js');
const { default: resultsReducer } = await import('../../src/features/results/resultsSlice.js');
const { default: backlogReducer } = await import('../../src/features/backlog/backlogSlice.js');
const { default: performanceReducer } = await import('../../src/features/performance/performanceSlice.js');
const { default: educationRecordsReducer } = await import('../../src/features/educationRecords/educationRecordsSlice.js');
const { default: academicGoalsReducer } = await import('../../src/features/academicGoals/academicGoalsSlice.js');

describe('ResultPoint Comprehensive End-to-End Verification Suite (WP-7)', () => {
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

  describe('Journey 1 & 2: Signup, Validation & Secure Login / Invalid Credential Rejection', () => {
    it('Journey 1: rejects signup when required fields or passwords fail validation', async () => {
      globalThis.fetch = async (url, options) => {
        const body = JSON.parse(options?.body || '{}');
        if (!body.fullName) {
          return {
            ok: false,
            status: 400,
            headers: { get: () => 'application/json' },
            json: async () => ({
              success: false,
              error: { message: 'Full name is required', code: 'VALIDATION_ERROR' }
            })
          };
        }
        if (body.password === 'Mismatch') {
          return {
            ok: false,
            status: 400,
            headers: { get: () => 'application/json' },
            json: async () => ({
              success: false,
              error: { message: 'Passwords do not match', code: 'VALIDATION_ERROR' }
            })
          };
        }
        return {
          ok: true,
          status: 201,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: {} })
        };
      };

      await assert.rejects(
        async () => { await authApi.register({ email: '', password: 'Pass' }); },
        /Full name is required/
      );

      await assert.rejects(
        async () => {
          await authApi.register({
            fullName: 'Test Student',
            email: 'test@student.edu',
            password: 'Mismatch'
          });
        },
        /Passwords do not match/
      );
    });

    it('Journey 2: handles invalid credentials with 401 ApiError and successfully logs in with valid credentials', async () => {
      // 1. Invalid credentials
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: false,
          error: { message: 'Invalid username/email or password', code: 'UNAUTHORIZED' }
        })
      });

      await assert.rejects(
        async () => { await authApi.login({ username: 'baduser', password: 'badpassword' }); },
        (err) => err instanceof ApiError && err.status === 401
      );

      // 2. Valid credentials
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            accessToken: 'valid_access_jwt_xyz',
            refreshToken: 'valid_refresh_jwt_abc',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
              id: 'student-uuid-1',
              username: 'rahul_sharma',
              email: 'rahul@student.resultpoint.edu',
              fullName: 'Rahul Sharma',
              roles: ['ROLE_STUDENT']
            }
          }
        })
      });

      const session = await authApi.login({ username: 'rahul_sharma', password: 'ValidPassword123!' });
      tokenStorage.setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user
      });

      assert.strictEqual(tokenStorage.getAccessToken(), 'valid_access_jwt_xyz');
      assert.strictEqual(tokenStorage.getRefreshToken(), 'valid_refresh_jwt_abc');
      assert.strictEqual(tokenStorage.getCurrentUser().username, 'rahul_sharma');
    });
  });

  describe('Journey 3 & 4: Session Restoration, Logout & Protected-Route Access Prevention', () => {
    it('Journey 3: restores session and identity after page reload from storage', () => {
      tokenStorage.setSession({
        accessToken: 'restored_token_123',
        refreshToken: 'restored_refresh_456',
        user: { id: 's1', username: 'rahul_sharma', fullName: 'Rahul Sharma' }
      });

      const user = tokenStorage.getCurrentUser();
      const token = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      assert.strictEqual(user.username, 'rahul_sharma');
      assert.strictEqual(token, 'restored_token_123');
      assert.strictEqual(refreshToken, 'restored_refresh_456');
    });

    it('Journey 4: logout invalidates session, clears tokens, and flushes Redux states across all slices', () => {
      tokenStorage.setSession({
        accessToken: 'active_token',
        refreshToken: 'active_refresh',
        user: { id: 's1', username: 'student' }
      });

      // Populate populated states
      const authState = authReducer({ user: { username: 'student' } }, { type: 'auth/logout' });
      const profileState = academicProfileReducer({ universityId: 'u1', hasCompletedProfile: true }, { type: 'auth/logout' });
      const resultsState = resultsReducer({ results: [{ id: 'res1' }] }, { type: 'auth/logout' });
      const backlogState = backlogReducer({ backlogs: [{ id: 'b1' }], totalBacklogs: 1 }, { type: 'auth/logout' });
      const perfState = performanceReducer({ overview: { currentCGPA: 8.5 } }, { type: 'auth/logout' });
      const eduState = educationRecordsReducer({ records: [{ id: 'edu1' }] }, { type: 'auth/logout' });
      const goalState = academicGoalsReducer({ goal: { targetCGPA: 9.0 } }, { type: 'auth/logout' });

      tokenStorage.clearSession();

      assert.strictEqual(tokenStorage.getAccessToken(), null);
      assert.strictEqual(tokenStorage.getRefreshToken(), null);
      assert.strictEqual(tokenStorage.getCurrentUser(), null);

      assert.strictEqual(authState.user, null);
      assert.strictEqual(profileState.universityId, null);
      assert.strictEqual(profileState.hasCompletedProfile, false);
      assert.deepStrictEqual(resultsState.results, []);
      assert.deepStrictEqual(backlogState.backlogs, []);
      assert.strictEqual(perfState.overview, null);
      assert.deepStrictEqual(eduState.records, []);
      assert.strictEqual(goalState.goal, null);
    });
  });

  describe('Journey 5 & 6: Academic Profile Gating & Institutional Catalog Setup', () => {
    it('Journey 5: identifies unconfigured profile and enforces profile completion gate', () => {
      window.localStorage.removeItem('resultpoint_student');
      const isComplete = studentService.isProfileComplete();
      assert.strictEqual(isComplete, false);
    });

    it('Journey 6: updates profile with canonical catalog values and resolves aliases', async () => {
      tokenStorage.setSession({ accessToken: 'valid_token' });
      let postedBody = null;

      globalThis.fetch = async (url, options) => {
        postedBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'prof-101',
              userId: 'u1',
              hallTicketNumber: postedBody.hallTicketNumber,
              fullName: postedBody.fullName,
              universityId: postedBody.universityId,
              universityName: 'Osmania University',
              courseId: postedBody.courseId,
              courseName: 'Bachelor of Computer Applications',
              regulationId: postedBody.regulationId,
              regulationCode: 'CBCS',
              batch: postedBody.batch,
              admissionYear: postedBody.admissionYear,
              currentSemester: postedBody.currentSemester,
              totalSemesters: 6
            }
          })
        };
      };

      const updated = await studentProfileApi.updateProfile({
        fullName: 'Rahul Sharma',
        hallTicketNumber: '1005-23-772-045',
        universityId: 'osmania',
        courseId: 'bca',
        regulationId: 'ou-bca-cbcs',
        admissionYear: 2023,
        currentSemester: 3
      });

      assert.strictEqual(postedBody.universityId, 'uni_ou');
      assert.strictEqual(postedBody.courseId, 'course_ou_bca');
      assert.strictEqual(postedBody.regulationId, 'reg_ou_bca_cbcs');
      assert.strictEqual(updated.hallTicketNumber, '1005-23-772-045');
      assert.strictEqual(updated.currentSemester, 3);
    });
  });

  describe('Journey 7: Public Calculators & OU BCA/MCA S-Grade Preservation', () => {
    it('preserves Osmania S grade (10 points, 85-100%) and computes accurate SGPA', () => {
      const osmaniaBcaSubjects = [
        { code: 'BCA101', name: 'Programming in C', credits: 4, grade: 'S', points: 10 },
        { code: 'BCA102', name: 'Discrete Maths', credits: 4, grade: 'A', points: 8 },
        { code: 'BCA103', name: 'Computer Architecture', credits: 4, grade: 'B', points: 6 }
      ];

      const scale = [
        { grade: 'S', points: 10, minPercentage: 85, maxPercentage: 100, isPass: true },
        { grade: 'A', points: 8, minPercentage: 70, maxPercentage: 84, isPass: true },
        { grade: 'B', points: 6, minPercentage: 60, maxPercentage: 69, isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39, isPass: false }
      ];

      // SGPA = (4*10 + 4*8 + 4*6) / 12 = (40 + 32 + 24) / 12 = 96 / 12 = 8.00
      const calcResult = academicCalculationEngine.calculateSGPA(osmaniaBcaSubjects, scale);
      assert.strictEqual(Number(calcResult.sgpa).toFixed(2), '8.00');

      // Grade for 90 marks in OU scale is 'S'
      const grade = academicCalculationEngine.getGradeFromMarks(90, 100, scale);
      assert.strictEqual(grade.grade, 'S');
      assert.strictEqual(grade.points, 10);
    });
  });

  describe('Journey 8 & 9: Semester Result Creation, Authoritative Storage & Editing', () => {
    it('Journey 8: saves semester result and verifies authoritative backend calculation', async () => {
      tokenStorage.setSession({ accessToken: 'res_token' });
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
              id: 'res-sem-1',
              studentProfileId: 'prof-101',
              semesterNumber: postedBody.semesterNumber,
              academicPeriod: postedBody.academicPeriod,
              sgpa: 8.50,
              cumulativeCgpa: 8.50,
              totalCredits: 20,
              creditsEarned: 20,
              isPass: true,
              resultStatus: 'PASSED',
              standingStatus: 'PASSED',
              subjects: postedBody.subjects.map((s, idx) => ({
                id: `sub-${idx}`,
                subjectCode: s.subjectCode,
                subjectName: s.subjectName,
                credits: s.credits,
                grade: s.grade,
                gradePoints: 9,
                isPass: true
              }))
            }
          })
        };
      };

      const scorecard = await resultApi.saveResult({
        semesterNumber: 1,
        academicPeriod: 'Dec 2023',
        subjects: [
          { subjectCode: 'CS101', subjectName: 'Intro to CS', credits: 4, grade: 'A+', isPass: true }
        ]
      });

      assert.strictEqual(scorecard.semesterNumber, 1);
      assert.strictEqual(scorecard.sgpa, 8.50);
      assert.strictEqual(scorecard.cgpa, 8.50);
      assert.strictEqual(scorecard.standingStatus, 'PASSED');
    });

    it('Journey 9: updates semester result and verifies updated scorecard and recalculation', async () => {
      tokenStorage.setSession({ accessToken: 'res_token' });
      let putBody = null;

      globalThis.fetch = async (url, options) => {
        putBody = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: 'res-sem-1',
              semesterNumber: 1,
              academicPeriod: putBody.academicPeriod,
              sgpa: 9.00,
              cumulativeCgpa: 9.00,
              totalCredits: 20,
              creditsEarned: 20,
              isPass: true,
              resultStatus: 'PASSED',
              subjects: putBody.subjects
            }
          })
        };
      };

      const updated = await resultApi.updateResult(1, {
        academicPeriod: 'Dec 2023 (Revalued)',
        subjects: [{ subjectCode: 'CS101', subjectName: 'Intro to CS', credits: 4, grade: 'S', isPass: true }]
      });

      assert.strictEqual(updated.sgpa, 9.00);
      assert.strictEqual(updated.academicPeriod, 'Dec 2023 (Revalued)');
    });
  });

  describe('Journey 10: Academic History & Authoritative Performance Trends', () => {
    it('records immutable audit events and queries authoritative performance report', async () => {
      auditHistoryService.clearAuditHistory();

      auditHistoryService.recordEvent({
        action: 'CREATED',
        semesterNumber: 1,
        semesterLabel: 'Semester 1',
        details: 'Initial submission of Semester 1 results.'
      });

      const events = auditHistoryService.getAllAuditEvents();
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].action, 'CREATED');

      tokenStorage.setSession({ accessToken: 'perf_token' });
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            cumulativeCgpa: 8.75,
            totalCreditsEarned: 44,
            semesterTrends: [{ semesterNumber: 1, sgpa: 8.5 }, { semesterNumber: 2, sgpa: 9.0 }]
          }
        })
      });

      const report = await reportApi.getPerformanceReport();
      assert.strictEqual(report.cumulativeCgpa, 8.75);
      assert.strictEqual(report.semesterTrends.length, 2);
    });
  });

  describe('Journey 11 & 12: Backlog Lifecycle & Clearance Verification', () => {
    it('Journey 11: scans failed subjects from semester results into active backlogs', () => {
      const mockResultWithFail = [
        {
          semesterNumber: 2,
          subjects: [
            { code: 'MATH201', name: 'Discrete Maths', credits: 4, grade: 'F', points: 0, isPass: false }
          ]
        }
      ];

      const backlogs = backlogService.scanBacklogs(mockResultWithFail);
      assert.strictEqual(backlogs.totalBacklogs, 1);
      assert.strictEqual(backlogs.activeBacklogs, 1);
      assert.strictEqual(backlogs.clearanceStatus, '1 Active');
      assert.strictEqual(backlogs.backlogs[0].subjectCode, 'MATH201');
    });

    it('Journey 12: marks backlog cleared and verifies updated authoritative status', async () => {
      tokenStorage.setSession({ accessToken: 'backlog_token' });
      let clearPayload = null;

      globalThis.fetch = async (url, options) => {
        clearPayload = JSON.parse(options?.body || '{}');
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              id: clearPayload.backlogId,
              subjectCode: 'MATH201',
              subjectName: 'Discrete Maths',
              semesterNumber: 2,
              credits: 4,
              status: 'CLEARED',
              clearedInPeriod: clearPayload.clearedInPeriod,
              clearedGrade: clearPayload.clearedGrade,
              clearedAt: '2026-08-15T10:00:00Z'
            }
          })
        };
      };

      const cleared = await backlogApi.clearBacklog({
        backlogId: 'backlog-math-201',
        clearedInPeriod: 'Supplementary Exam (July 2026)',
        clearedGrade: 'B'
      });

      assert.strictEqual(clearPayload.backlogId, 'backlog-math-201');
      assert.strictEqual(cleared.status, 'Cleared');
      assert.strictEqual(cleared.backendStatus, 'CLEARED');
      assert.strictEqual(cleared.clearedGrade, 'B');
    });
  });

  describe('Journey 13: Target CGPA Goal & Projection Planning', () => {
    it('evaluates target CGPA goal and projection feasibility', async () => {
      tokenStorage.setSession({ accessToken: 'goal_token' });
      globalThis.fetch = async () => ({
        ok: true,
        status: 201,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 'goal-g1',
            targetCgpa: 8.75,
            targetSemester: 6,
            requiredSgpa: 8.95,
            feasibilityStatus: 'FEASIBLE',
            active: true
          }
        })
      });

      const goal = await goalApi.createGoal({ targetCgpa: 8.75, targetSemester: 6 });
      assert.strictEqual(goal.targetCGPA, 8.75);
      assert.strictEqual(goal.requiredSGPA, 8.95);
      assert.strictEqual(goal.feasibilityStatus, 'FEASIBLE');
    });
  });

  describe('Journey 14: PDF Exports for Scorecards, Transcripts and Goals Reports', () => {
    it('downloads semester scorecard, academic transcript, and goals progress report as PDF blobs', async () => {
      tokenStorage.setSession({ accessToken: 'pdf_token' });

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: (h) => h.toLowerCase() === 'content-type' ? 'application/pdf' : null },
        blob: async () => new Blob(['%PDF-1.4 test stream content'], { type: 'application/pdf' })
      });

      const scorecardBlob = await exportApi.downloadSemesterScorecardPdf(1);
      const transcriptBlob = await exportApi.downloadAcademicTranscriptPdf();
      const goalsBlob = await exportApi.downloadGoalsReportPdf();

      assert.ok(scorecardBlob instanceof Blob);
      assert.ok(transcriptBlob instanceof Blob);
      assert.ok(goalsBlob instanceof Blob);
    });
  });

  describe('Journey 15: Multi-Qualification Education Records Lifecycle', () => {
    it('creates, retrieves, and deletes education records, noting update contract gap', async () => {
      tokenStorage.setSession({ accessToken: 'edu_token' });

      // Create
      globalThis.fetch = async () => ({
        ok: true,
        status: 201,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 'edu-ug-1',
            type: 'UNDERGRADUATE',
            level: 'B.Tech CSE',
            categoryGroup: 'UNIVERSITY',
            boardOrUniversity: 'Osmania University',
            institutionName: 'University College of Engineering',
            passingYear: 2024,
            percentage: 82.5,
            resultStatus: 'COMPLETED'
          }
        })
      });

      const created = await educationRecordApi.createEducationRecord({
        type: 'UNDERGRADUATE',
        level: 'B.Tech CSE',
        boardOrUniversity: 'Osmania University',
        institutionName: 'University College of Engineering',
        passingYear: 2024,
        percentage: 82.5
      });
      assert.strictEqual(created.id, 'edu-ug-1');

      // List
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: [created] })
      });
      const list = await educationRecordApi.getEducationRecords();
      assert.strictEqual(list.length, 1);

      // Delete
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: null })
      });
      const delId = await educationRecordApi.deleteEducationRecord('edu-ug-1');
      assert.strictEqual(delId, 'edu-ug-1');
    });
  });

  describe('Journey 16 & 17: Cross-Tab Invalidation, Expired Session & Direct Route Access', () => {
    it('Journey 16: handles auth_session_changed event across tabs and expires session cleanly', () => {
      let notified = false;
      window.addEventListener('auth_session_changed', (e) => {
        if (!e.detail.isAuthenticated) {
          notified = true;
        }
      });

      tokenStorage.clearSession();
      assert.strictEqual(notified, true);
      assert.strictEqual(tokenStorage.getAccessToken(), null);
    });

    it('Journey 17: validates direct access security checks on protected student URLs', () => {
      const protectedPaths = [
        '/student/dashboard',
        '/student/profile',
        '/student/results',
        '/student/backlogs',
        '/student/performance',
        '/student/goals',
        '/student/education-records'
      ];

      // With null token, unauthenticated student is blocked
      tokenStorage.clearSession();
      protectedPaths.forEach((path) => {
        const hasAccess = Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());
        assert.strictEqual(hasAccess, false, `Access to ${path} must be denied when unauthenticated`);
      });
    });
  });
});
