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

const { backlogService, isSubjectFailed } = await import('../../src/services/backlogService.js');
const { resultService } = await import('../../src/services/resultService.js');
const {
  default: backlogReducer,
  selectBacklogs,
  selectActiveBacklogs,
  selectClearedBacklogs,
  selectTotalBacklogs,
  selectBacklogLoading,
  selectBacklogError,
  fetchBacklogs,
  markBacklogCleared
} = await import('../../src/features/backlog/backlogSlice.js');
const { fetchResults } = await import('../../src/features/results/resultsSlice.js');

describe('Backlog Tracker Error Investigation & Remediation Verification Suite', () => {

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  // =========================================================================
  // 1. BacklogTracker.jsx Source Code & Import Integrity
  // =========================================================================
  describe('1. BacklogTracker.jsx Component Integrity', () => {
    it('BacklogTracker.jsx imports fetchResults from resultsSlice', () => {
      const filePath = path.resolve('src/pages/student/BacklogTracker.jsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.ok(
        content.includes("import { fetchResults } from '../../features/results/resultsSlice';"),
        'BacklogTracker.jsx must import fetchResults from resultsSlice'
      );
    });

    it('BacklogTracker.jsx imports selectBacklogLoading and selectBacklogError', () => {
      const filePath = path.resolve('src/pages/student/BacklogTracker.jsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.ok(
        content.includes('selectBacklogLoading'),
        'BacklogTracker.jsx must import and select selectBacklogLoading'
      );
      assert.ok(
        content.includes('selectBacklogError'),
        'BacklogTracker.jsx must import and select selectBacklogError'
      );
    });

    it('BacklogTracker.jsx renders error alert and retry button on failure', () => {
      const filePath = path.resolve('src/pages/student/BacklogTracker.jsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.ok(
        content.includes('{error && ('),
        'BacklogTracker.jsx must conditionally render error banner when error is non-null'
      );
      assert.ok(
        content.includes('Retry Scan'),
        'BacklogTracker.jsx must include a retry button to re-dispatch fetchBacklogs'
      );
    });

    it('BacklogTracker.jsx renders clean loading state when loading with empty list', () => {
      const filePath = path.resolve('src/pages/student/BacklogTracker.jsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.ok(
        content.includes('Scanning Backlogs & Arrears'),
        'BacklogTracker.jsx must provide a dedicated loading indicator for backlog scans'
      );
    });

    it('fetchResults is a valid Redux AsyncThunk', () => {
      assert.equal(typeof fetchResults, 'function');
      assert.equal(typeof fetchResults.pending?.type, 'string');
      assert.equal(typeof fetchResults.fulfilled?.type, 'string');
      assert.equal(typeof fetchResults.rejected?.type, 'string');
    });
  });

  // =========================================================================
  // 2. Backlog Slice Loading, Error, and Selectors Stability
  // =========================================================================
  describe('2. Redux Selectors and State Handling', () => {
    it('selectBacklogLoading and selectBacklogError correctly extract state properties', () => {
      const testState = {
        backlog: {
          backlogs: [],
          totalBacklogs: 0,
          activeBacklogs: 0,
          clearedBacklogs: 0,
          loading: true,
          error: 'Simulated connection error'
        }
      };

      assert.strictEqual(selectBacklogLoading(testState), true);
      assert.strictEqual(selectBacklogError(testState), 'Simulated connection error');
    });

    it('rejected actions populate state.error and reset loading to false', () => {
      const prevState = {
        backlogs: [],
        totalBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        loading: true,
        error: null
      };

      const errorAction = {
        type: fetchBacklogs.rejected.type,
        payload: 'Network error 500: Server unavailable'
      };

      const nextState = backlogReducer(prevState, errorAction);
      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.error, 'Network error 500: Server unavailable');
    });
  });

  // =========================================================================
  // 3. Academic Backlog Detection Rules & Clearance
  // =========================================================================
  describe('3. Academic Backlog Rules Verification', () => {
    it('identifies failed subjects with grade F, AB, or isPass false', () => {
      assert.strictEqual(isSubjectFailed({ grade: 'F', points: 0, isPass: false }), true);
      assert.strictEqual(isSubjectFailed({ grade: 'AB', points: 0, isPass: false }), true);
      assert.strictEqual(isSubjectFailed({ grade: 'FAIL', points: 0 }), true);
      assert.strictEqual(isSubjectFailed({ isPass: false }), true);
    });

    it('does NOT flag passed subjects as backlogs', () => {
      assert.strictEqual(isSubjectFailed({ grade: 'A', points: 8, isPass: true }), false);
      assert.strictEqual(isSubjectFailed({ grade: 'B', points: 6, isPass: true }), false);
      assert.strictEqual(isSubjectFailed({ grade: 'S', points: 10, isPass: true }), false);
      assert.strictEqual(isSubjectFailed({ grade: 'P', points: 4, isPass: true }), false);
    });

    it('scanBacklogs returns clean zero state when student has no saved results', () => {
      const scan = backlogService.scanBacklogs([]);
      assert.strictEqual(scan.totalBacklogs, 0);
      assert.strictEqual(scan.activeBacklogs, 0);
      assert.strictEqual(scan.clearedBacklogs, 0);
      assert.strictEqual(scan.clearanceStatus, 'All Clear');
      assert.deepStrictEqual(scan.backlogs, []);
    });

    it('scanBacklogs isolates backlogs per semester and tracks cleared backlogs accurately', () => {
      const resultsWithArrear = [
        {
          id: 'sem-1',
          semesterNumber: 1,
          semesterLabel: 'Semester 1',
          subjects: [
            { code: 'MATH101', name: 'Mathematics I', credits: 4, grade: 'F', points: 0, isPass: false },
            { code: 'CS101', name: 'Intro to CS', credits: 4, grade: 'A', points: 8, isPass: true }
          ]
        },
        {
          id: 'sem-2',
          semesterNumber: 2,
          semesterLabel: 'Semester 2',
          subjects: [
            { code: 'CS201', name: 'Data Structures', credits: 4, grade: 'B', points: 6, isPass: true }
          ]
        }
      ];

      resultService.setResults(resultsWithArrear);
      const scan = backlogService.scanBacklogs(resultsWithArrear);
      assert.strictEqual(scan.totalBacklogs, 1);
      assert.strictEqual(scan.activeBacklogs, 1);
      assert.strictEqual(scan.clearedBacklogs, 0);
      assert.strictEqual(scan.backlogs[0].subjectCode, 'MATH101');
      assert.strictEqual(scan.backlogs[0].status, 'Active');

      // Now clear the backlog via supplementary examination
      const cleared = backlogService.clearBacklog({
        semesterId: 'sem-1',
        semesterNumber: 1,
        subjectCode: 'MATH101',
        clearedGrade: 'B',
        clearedPoints: 6,
        clearedPeriod: 'Supplementary Exam (Nov 2026)'
      });

      assert.strictEqual(cleared.activeBacklogs, 0);
      assert.strictEqual(cleared.clearedBacklogs, 1);
      assert.strictEqual(cleared.clearanceRate, 100);
      assert.strictEqual(cleared.backlogs[0].status, 'Cleared');
      assert.strictEqual(cleared.backlogs[0].clearedGrade, 'B');
    });
  });
});
