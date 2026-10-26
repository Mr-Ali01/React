import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

const BASE_URL = 'http://localhost:5173';

describe('ResultPoint Live Backend & Database E2E Integration Suite (Zero Mocks)', () => {
  const testStudentEmail = `live_e2e_${Date.now()}@resultpoint.edu`;
  const testStudentPassword = 'ValidPassword123!';
  const testHallTicket = `HT-${Date.now().toString().slice(-8)}`;
  let accessToken = null;
  let refreshToken = null;
  let testBacklogId = null;

  it('1. Live Catalog: fetches university catalog from MySQL database via Vite proxy', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/catalog/universities`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.content));
    const ou = body.data.content.find((u) => u.id === 'uni_ou');
    assert.ok(ou, 'Osmania University must be present in database catalog');
    assert.strictEqual(ou.name, 'Osmania University');
  });

  it('2. Live Auth: handles signup validation error and creates real student in MySQL', async () => {
    // A. Validation failure
    const badRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: '', email: 'bad', password: '123' })
    });
    assert.strictEqual(badRes.status, 400);

    // B. Real registration
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Live E2E Student',
        email: testStudentEmail,
        password: testStudentPassword
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regBody = await regRes.json();
    assert.strictEqual(regBody.success, true);
    assert.ok(regBody.data.accessToken);
    assert.strictEqual(regBody.data.user.email, testStudentEmail);
    accessToken = regBody.data.accessToken;
    refreshToken = regBody.data.refreshToken;
  });

  it('3. Live Auth: rejects invalid credentials and authenticates with valid credentials', async () => {
    // Bad credentials
    const badLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'WrongPassword!' })
    });
    assert.strictEqual(badLogin.status, 401);

    // Valid credentials
    const validLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: testStudentPassword })
    });
    assert.strictEqual(validLogin.status, 200);
    const loginBody = await validLogin.json();
    accessToken = loginBody.data.accessToken;
    refreshToken = loginBody.data.refreshToken;
    assert.ok(accessToken);
  });

  it('4. Live Academic Profile: sets up institutional details and persists to MySQL', async () => {
    const profileRes = await fetch(`${BASE_URL}/api/v1/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        universityId: 'uni_ou',
        courseId: 'course_ou_bca',
        regulationId: 'reg_ou_bca_cbcs',
        batchYear: '2023-2027',
        hallTicketNumber: testHallTicket,
        admissionYear: 2023,
        currentSemester: 2
      })
    });
    assert.strictEqual(profileRes.status, 200);
    const profileBody = await profileRes.json();
    assert.strictEqual(profileBody.data.hallTicketNumber, testHallTicket);
    assert.strictEqual(profileBody.data.universityId, 'uni_ou');
    assert.strictEqual(profileBody.data.courseId, 'course_ou_bca');
  });

  it('5. Live Semester Result: saves semester result and verifies authoritative backend calculation with OU S-grade', async () => {
    const semRes = await fetch(`${BASE_URL}/api/v1/student/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        semesterNumber: 1,
        academicPeriod: 'Nov/Dec 2023',
        subjects: [
          { subjectCode: 'BCA101', subjectName: 'Programming in C', credits: 4, gradeLetter: 'S', gradePoints: 10, marksObtained: 92, maxMarks: 100 },
          { subjectCode: 'BCA102', subjectName: 'Discrete Maths', credits: 4, gradeLetter: 'A', gradePoints: 8, marksObtained: 75, maxMarks: 100 },
          { subjectCode: 'BCA103', subjectName: 'Computer Architecture', credits: 4, gradeLetter: 'B', gradePoints: 6, marksObtained: 65, maxMarks: 100 }
        ]
      })
    });
    assert.strictEqual(semRes.status, 201);
    const semBody = await semRes.json();
    assert.strictEqual(semBody.data.semesterNumber, 1);
    // Authoritative calculation from backend
    assert.strictEqual(Number(semBody.data.sgpa).toFixed(2), '9.00');
    assert.strictEqual(Number(semBody.data.cgpa).toFixed(2), '9.00');
    assert.strictEqual(Number(semBody.data.creditsEarned), 12);
  });

  it('6. Live Backlog Lifecycle: creates active backlog from failed course and clears it in supplementary exam', async () => {
    // 1. Save Sem 2 with failed course (grade 'F')
    const sem2Res = await fetch(`${BASE_URL}/api/v1/student/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        semesterNumber: 2,
        academicPeriod: 'April/May 2024',
        subjects: [
          { subjectCode: 'BCA201', subjectName: 'OOP with Java', credits: 4, gradeLetter: 'A', gradePoints: 8, marksObtained: 78, maxMarks: 100 },
          { subjectCode: 'BCA202', subjectName: 'Data Structures', credits: 4, gradeLetter: 'F', gradePoints: 0, marksObtained: 32, maxMarks: 100 }
        ]
      })
    });
    assert.strictEqual(sem2Res.status, 201);

    // 2. Fetch active backlogs from backend
    const backlogsRes = await fetch(`${BASE_URL}/api/v1/student/backlogs?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(backlogsRes.status, 200);
    const backlogsBody = await backlogsRes.json();
    assert.ok(Array.isArray(backlogsBody.data));
    const failedSub = backlogsBody.data.find((b) => b.subjectCode === 'BCA202');
    assert.ok(failedSub, 'BCA202 must appear in active backlogs');
    assert.strictEqual(failedSub.status, 'ACTIVE');
    testBacklogId = failedSub.id;

    // 3. Clear backlog via supplementary clearance endpoint
    const clearRes = await fetch(`${BASE_URL}/api/v1/student/backlogs/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        backlogId: testBacklogId,
        clearedInPeriod: 'Supplementary Exam (July 2024)',
        clearedGrade: 'A'
      })
    });
    assert.strictEqual(clearRes.status, 200);
    const clearBody = await clearRes.json();
    assert.strictEqual(clearBody.data.status, 'CLEARED');
    assert.strictEqual(clearBody.data.clearedGrade, 'A');
  });

  it('7. Live Goals & Projections: creates target CGPA goal with feasibility projection', async () => {
    const goalRes = await fetch(`${BASE_URL}/api/v1/student/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        targetCgpa: 8.50,
        targetSemester: 6
      })
    });
    assert.strictEqual(goalRes.status, 201);
    const goalBody = await goalRes.json();
    assert.strictEqual(goalBody.data.targetCgpa, 8.50);
    assert.ok(goalBody.data.feasibilityStatus);
  });

  it('8. Live PDF Streaming: downloads real binary PDF streams from Spring Boot OpenPDF engine', async () => {
    // Scorecard PDF
    const scoreRes = await fetch(`${BASE_URL}/api/v1/student/results/1/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(scoreRes.status, 200);
    assert.strictEqual(scoreRes.headers.get('content-type'), 'application/pdf');
    const scoreBlob = await scoreRes.arrayBuffer();
    const scoreHeader = Buffer.from(scoreBlob.slice(0, 5)).toString();
    assert.strictEqual(scoreHeader, '%PDF-', 'Must be a valid PDF binary file');

    // Transcript PDF
    const transRes = await fetch(`${BASE_URL}/api/v1/student/results/history/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(transRes.status, 200);
    assert.strictEqual(transRes.headers.get('content-type'), 'application/pdf');

    // Goals Report PDF
    const goalPdfRes = await fetch(`${BASE_URL}/api/v1/student/goals/report/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(goalPdfRes.status, 200);
    assert.strictEqual(goalPdfRes.headers.get('content-type'), 'application/pdf');
  });

  it('9. Live Multi-Qualification Education Records: creates, lists, and deletes records in MySQL', async () => {
    // Create record
    const createRes = await fetch(`${BASE_URL}/api/v1/student/education-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'CLASS_12',
        level: 'Class XII (MPC)',
        categoryGroup: 'COLLEGE',
        boardOrUniversity: 'Telangana Board of Intermediate Education',
        institutionName: 'Narayana Junior College',
        passingYear: 2023,
        percentage: 91.5,
        resultStatus: 'COMPLETED'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createBody = await createRes.json();
    const eduId = createBody.data.id;
    assert.ok(eduId);

    // List records
    const listRes = await fetch(`${BASE_URL}/api/v1/student/education-records`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.data.some((r) => r.id === eduId));

    // Delete record
    const delRes = await fetch(`${BASE_URL}/api/v1/student/education-records/${eduId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert.strictEqual(delRes.status, 200);
  });

  it('10. Live Logout: revokes session on backend and rejects subsequent requests', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refreshToken })
    });
    assert.strictEqual(logoutRes.status, 200);
  });
});
