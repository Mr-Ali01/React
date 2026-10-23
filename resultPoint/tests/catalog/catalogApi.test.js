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

const { catalogApi, CATALOG_ID_ALIASES } = await import('../../src/services/api/catalogApi.js');
const { ApiError } = await import('../../src/services/api/apiClient.js');

describe('ResultPoint Academic Catalog API Unit Suite (WP-2)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. should resolve catalog aliases correctly to canonical database IDs', () => {
    assert.equal(CATALOG_ID_ALIASES['osmania'], 'uni_ou');
    assert.equal(catalogApi.resolveId('osmania'), 'uni_ou');
    assert.equal(catalogApi.resolveId('ou'), 'uni_ou');
    assert.equal(catalogApi.resolveId('jntuh'), 'uni_jntuh');
    assert.equal(catalogApi.resolveId('bca'), 'course_ou_bca');
    assert.equal(catalogApi.resolveId('ou-bca'), 'course_ou_bca');
    assert.equal(catalogApi.resolveId('mca'), 'course_ou_mca');
    assert.equal(catalogApi.resolveId('ou-bca-cbcs'), 'reg_ou_bca_cbcs');
    assert.equal(catalogApi.resolveId('r18'), 'reg_jntuh_r18');
    assert.equal(catalogApi.resolveId('10-point-s'), 'scale_ou_cbcs_s');
    assert.equal(catalogApi.resolveId('10-point-o'), 'scale_standard_o');
    // Unmapped canonical ID passes through unchanged
    assert.equal(catalogApi.resolveId('custom_id_123'), 'custom_id_123');
    assert.equal(catalogApi.resolveId(null), null);
  });

  it('2. should fetch universities list with pagination and query parameters', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [
            { id: 'uni_ou', code: 'OU', name: 'Osmania University', status: 'ACTIVE' },
            { id: 'uni_jntuh', code: 'JNTUH', name: 'Jawaharlal Nehru Technological University', status: 'ACTIVE' }
          ],
          total: 2,
          page: 0,
          size: 20
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await catalogApi.getUniversities({ status: 'ACTIVE', page: 0, size: 10, search: 'Osmania' });

    assert.ok(capturedUrl.includes('/api/v1/catalog/universities'));
    assert.ok(capturedUrl.includes('status=ACTIVE'));
    assert.ok(capturedUrl.includes('page=0'));
    assert.ok(capturedUrl.includes('size=10'));
    assert.ok(capturedUrl.includes('search=Osmania'));
    assert.equal(capturedOptions.method, 'GET');
    assert.equal(res.items.length, 2);
    assert.equal(res.items[0].id, 'uni_ou');
  });

  it('3. should fetch university by ID with alias resolution', async () => {
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({
        success: true,
        data: {
          id: 'uni_ou',
          code: 'OU',
          name: 'Osmania University',
          type: 'STATE_PUBLIC',
          gradingSystem: 'CBCS_10_POINT_SUPER'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // Pass alias 'osmania' instead of canonical ID
    const res = await catalogApi.getUniversityById('osmania');

    assert.equal(capturedUrl, '/api/v1/catalog/universities/uni_ou');
    assert.equal(res.id, 'uni_ou');
    assert.equal(res.code, 'OU');
  });

  it('4. should fetch courses by university with alias resolution', async () => {
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({
        success: true,
        data: [
          { id: 'course_ou_bca', code: 'BCA', name: 'Bachelor of Computer Applications', level: 'UNDERGRADUATE' },
          { id: 'course_ou_mca', code: 'MCA', name: 'Master of Computer Applications', level: 'POSTGRADUATE' }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await catalogApi.getCoursesByUniversity('ou');

    assert.equal(capturedUrl, '/api/v1/catalog/universities/uni_ou/courses');
    assert.equal(res.length, 2);
    assert.equal(res[0].code, 'BCA');
  });

  it('5. should fetch regulations by course with alias resolution', async () => {
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({
        success: true,
        data: [
          {
            id: 'reg_ou_bca_cbcs',
            name: 'OU BCA CBCS 2022',
            gradingScaleId: 'scale_ou_cbcs_s',
            calculationRuleId: 'rule_ou_cbcs_standard'
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await catalogApi.getRegulationsByCourse('bca');

    assert.equal(capturedUrl, '/api/v1/catalog/courses/course_ou_bca/regulations');
    assert.equal(res.length, 1);
    assert.equal(res[0].gradingScaleId, 'scale_ou_cbcs_s');
  });

  it('6. should fetch single regulation detail by ID with alias resolution', async () => {
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({
        success: true,
        data: {
          id: 'reg_ou_bca_cbcs',
          name: 'OU BCA CBCS Regulation',
          gradingScaleId: 'scale_ou_cbcs_s',
          gradingScale: {
            id: 'scale_ou_cbcs_s',
            name: 'Osmania CBCS (S Grade 85%+)',
            topGrade: 'S',
            grades: [
              { letter: 'S', gradePoints: 10.0, minMarks: 85, maxMarks: 100 },
              { letter: 'A', gradePoints: 9.0, minMarks: 70, maxMarks: 84.99 }
            ]
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await catalogApi.getRegulationById('ou-bca-cbcs');

    assert.equal(capturedUrl, '/api/v1/catalog/regulations/reg_ou_bca_cbcs');
    assert.equal(res.id, 'reg_ou_bca_cbcs');
    assert.equal(res.gradingScale.topGrade, 'S');
  });

  it('7. should fetch regulation curriculum with semester filter', async () => {
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({
        success: true,
        data: [
          { subjectCode: 'BCA101', subjectName: 'Discrete Mathematics', credits: 4, semesterNumber: 1 },
          { subjectCode: 'BCA102', subjectName: 'Computer Programming with C', credits: 4, semesterNumber: 1 }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const res = await catalogApi.getRegulationCurriculum('ou-bca-cbcs', 1);

    assert.equal(capturedUrl, '/api/v1/catalog/regulations/reg_ou_bca_cbcs/curriculum?semesterNumber=1');
    assert.equal(res.length, 2);
    assert.equal(res[0].subjectCode, 'BCA101');
  });

  it('8. should propagate backend 404 / 500 ApiError properly', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CATALOG_NOT_FOUND',
          message: 'Regulation non_existent_reg not found'
        }
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    await assert.rejects(
      async () => {
        await catalogApi.getRegulationById('non_existent_reg');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'CATALOG_NOT_FOUND');
        assert.equal(err.message, 'Regulation non_existent_reg not found');
        return true;
      }
    );
  });
});
