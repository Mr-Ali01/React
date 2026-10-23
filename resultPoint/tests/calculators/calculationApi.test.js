import { describe, it, beforeEach, afterEach, mock } from 'node:test';
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
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, params = {}) {
    this.name = name;
    this.detail = params.detail;
  }
};

const { calculationApi } = await import('../../src/services/api/calculationApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');

describe('ResultPoint Calculation API & Public Calculators Unit Suite (WP-2)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. should validate calculateSgpa requires at least one subject', async () => {
    await assert.rejects(
      async () => {
        await calculationApi.calculateSgpa({ subjects: [] });
      },
      { message: 'At least one subject must be provided for SGPA calculation' }
    );
  });

  it('2. should format calculateSgpa request body with alias resolution and parse response', async () => {
    let capturedUrl = null;
    let capturedBody = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        success: true,
        data: {
          sgpa: 9.25,
          totalCredits: 20,
          earnedCredits: 20,
          totalGradePoints: 185.0,
          resultStatus: 'PASS',
          scaleId: 'scale_ou_cbcs_s',
          subjects: [
            { subjectCode: 'BCA101', subjectName: 'Programming in C', credits: 4, letterGrade: 'S', gradePoints: 10.0, earnedGradePoints: 40.0, isPassed: true },
            { subjectCode: 'BCA102', subjectName: 'Discrete Math', credits: 4, letterGrade: 'A', gradePoints: 9.0, earnedGradePoints: 36.0, isPassed: true }
          ]
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await calculationApi.calculateSgpa({
      universityId: 'osmania',
      regulationId: 'ou-bca-cbcs',
      subjects: [
        { code: 'BCA101', name: 'Programming in C', credits: 4, grade: 'S', points: 10 },
        { code: 'BCA102', name: 'Discrete Math', credits: 4, grade: 'A', points: 9 }
      ]
    });

    assert.equal(capturedUrl, '/api/v1/calculate/sgpa');
    assert.equal(capturedBody.universityId, 'uni_ou');
    assert.equal(capturedBody.regulationId, 'reg_ou_bca_cbcs');
    assert.equal(capturedBody.subjects.length, 2);
    assert.equal(capturedBody.subjects[0].subjectCode, 'BCA101');
    assert.equal(capturedBody.subjects[0].letterGrade, 'S');
    assert.equal(capturedBody.subjects[0].gradePoints, 10);
    assert.equal(res.sgpa, 9.25);
    assert.equal(res.scaleId, 'scale_ou_cbcs_s');
  });

  it('3. should validate calculateCgpa requires at least one semester', async () => {
    await assert.rejects(
      async () => {
        await calculationApi.calculateCgpa({ semesters: [] });
      },
      { message: 'At least one semester must be provided for CGPA calculation' }
    );
  });

  it('4. should format calculateCgpa request body with alias resolution and parse response', async () => {
    let capturedUrl = null;
    let capturedBody = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        success: true,
        data: {
          cgpa: 8.85,
          totalCredits: 44,
          earnedCredits: 44,
          totalWeightedPoints: 389.4,
          resultClassification: 'FIRST_CLASS_WITH_DISTINCTION',
          semesters: [
            { semesterNumber: 1, sgpa: 8.7, credits: 22, weightedPoints: 191.4 },
            { semesterNumber: 2, sgpa: 9.0, credits: 22, weightedPoints: 198.0 }
          ]
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await calculationApi.calculateCgpa({
      universityId: 'ou',
      regulationId: 'ou-bca-cbcs',
      semesters: [
        { semesterNumber: 1, sgpa: 8.7, credits: 22 },
        { semesterNumber: 2, sgpa: 9.0, credits: 22 }
      ]
    });

    assert.equal(capturedUrl, '/api/v1/calculate/cgpa');
    assert.equal(capturedBody.universityId, 'uni_ou');
    assert.equal(capturedBody.regulationId, 'reg_ou_bca_cbcs');
    assert.equal(capturedBody.semesters.length, 2);
    assert.equal(res.cgpa, 8.85);
    assert.equal(res.resultClassification, 'FIRST_CLASS_WITH_DISTINCTION');
  });

  it('5. should validate calculatePercentage bounds (0.0 to 10.0)', async () => {
    await assert.rejects(
      async () => {
        await calculationApi.calculatePercentage({ cgpa: -1 });
      },
      { message: 'Valid CGPA between 0.0 and 10.0 is required' }
    );

    await assert.rejects(
      async () => {
        await calculationApi.calculatePercentage({ cgpa: 10.5 });
      },
      { message: 'Valid CGPA between 0.0 and 10.0 is required' }
    );

    await assert.rejects(
      async () => {
        await calculationApi.calculatePercentage({ cgpa: 'invalid' });
      },
      { message: 'Valid CGPA between 0.0 and 10.0 is required' }
    );
  });

  it('6. should call calculatePercentage for Osmania CBCS formula (CGPA * 10)', async () => {
    let capturedBody = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        success: true,
        data: {
          cgpa: 8.5,
          percentage: 85.0,
          formulaApplied: 'CGPA * 10',
          ruleCode: 'rule_ou_cbcs_standard',
          ruleName: 'Osmania CBCS Percentage Conversion'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await calculationApi.calculatePercentage({
      cgpa: 8.5,
      universityId: 'osmania',
      regulationId: 'ou-bca-cbcs',
      ruleCode: 'rule_ou_cbcs_standard'
    });

    assert.equal(capturedBody.cgpa, 8.5);
    assert.equal(capturedBody.universityId, 'uni_ou');
    assert.equal(capturedBody.regulationId, 'reg_ou_bca_cbcs');
    assert.equal(capturedBody.ruleCode, 'rule_ou_cbcs_standard');
    assert.equal(res.percentage, 85.0);
    assert.equal(res.formulaApplied, 'CGPA * 10');
  });

  it('7. should call calculatePercentage for JNTUH R18 formula ((CGPA - 0.5) * 10)', async () => {
    let capturedBody = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        success: true,
        data: {
          cgpa: 8.5,
          percentage: 80.0,
          formulaApplied: '(CGPA - 0.5) * 10',
          ruleCode: 'rule_jntuh_r18',
          ruleName: 'JNTUH R18 Percentage Conversion'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await calculationApi.calculatePercentage({
      cgpa: 8.5,
      universityId: 'jntuh',
      regulationId: 'r18',
      ruleCode: 'rule_jntuh_r18'
    });

    assert.equal(capturedBody.cgpa, 8.5);
    assert.equal(capturedBody.universityId, 'uni_jntuh');
    assert.equal(capturedBody.regulationId, 'reg_jntuh_r18');
    assert.equal(capturedBody.ruleCode, 'rule_jntuh_r18');
    assert.equal(res.percentage, 80.0);
    assert.equal(res.formulaApplied, '(CGPA - 0.5) * 10');
  });

  it('8. should validate calculateTargetCgpa inputs and parse target feasibility', async () => {
    await assert.rejects(
      async () => {
        await calculationApi.calculateTargetCgpa({ currentCgpa: -1, targetCgpa: 8.5 });
      },
      { message: 'Valid current CGPA between 0.0 and 10.0 is required' }
    );

    let capturedBody = null;
    globalThis.fetch = mock.fn(async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        success: true,
        data: {
          targetCgpa: 9.0,
          currentCgpa: 8.5,
          requiredSgpa: 9.5,
          isAchievable: true,
          feasibility: 'CHALLENGING',
          maxPossibleCgpa: 9.25,
          recommendation: 'Target achievable with consistent S/A+ grade performance.'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await calculationApi.calculateTargetCgpa({
      currentCgpa: 8.5,
      targetCgpa: 9.0,
      completedCredits: 60,
      remainingCredits: 60
    });

    assert.equal(capturedBody.currentCgpa, 8.5);
    assert.equal(capturedBody.targetCgpa, 9.0);
    assert.equal(capturedBody.completedCredits, 60);
    assert.equal(capturedBody.remainingCredits, 60);
    assert.equal(res.requiredSgpa, 9.5);
    assert.equal(res.isAchievable, true);
    assert.equal(res.feasibility, 'CHALLENGING');
  });

  it('9. should fetch grading scales and verify Osmania S-grade preservation', async () => {
    globalThis.fetch = mock.fn(async (url) => {
      if (url.includes('/api/v1/calculate/scales/scale_ou_cbcs_s')) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            id: 'scale_ou_cbcs_s',
            code: 'OU_CBCS_SUPER_10',
            name: 'Osmania CBCS (Super S 85%+)',
            topGrade: 'S',
            grades: [
              { letter: 'S', gradePoints: 10.0, minMarks: 85.0, maxMarks: 100.0, description: 'Outstanding / Super' },
              { letter: 'A', gradePoints: 9.0, minMarks: 70.0, maxMarks: 84.99, description: 'Excellent' },
              { letter: 'B', gradePoints: 8.0, minMarks: 60.0, maxMarks: 69.99, description: 'Very Good' },
              { letter: 'C', gradePoints: 7.0, minMarks: 55.0, maxMarks: 59.99, description: 'Good' },
              { letter: 'D', gradePoints: 6.0, minMarks: 50.0, maxMarks: 54.99, description: 'Fair' },
              { letter: 'E', gradePoints: 5.0, minMarks: 40.0, maxMarks: 49.99, description: 'Pass' },
              { letter: 'F', gradePoints: 0.0, minMarks: 0.0, maxMarks: 39.99, description: 'Fail' }
            ]
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
    });

    const scale = await calculationApi.getGradingScaleById('10-point-s');

    assert.equal(scale.id, 'scale_ou_cbcs_s');
    assert.equal(scale.topGrade, 'S');
    const topGrade = scale.grades.find(g => g.letter === 'S');
    assert.ok(topGrade, 'Osmania top grade must be S');
    assert.equal(topGrade.gradePoints, 10.0);
    assert.equal(topGrade.minMarks, 85.0);
  });

  it('10. should handle calculation API errors with ApiError details', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CALCULATION_INVALID_INPUT',
          message: 'Target CGPA exceeds maximum possible 10.0'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    await assert.rejects(
      async () => {
        await calculationApi.calculateTargetCgpa({ currentCgpa: 8.0, targetCgpa: 10.0, completedCredits: 80, remainingCredits: 20 });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'CALCULATION_INVALID_INPUT');
        return true;
      }
    );
  });
});
