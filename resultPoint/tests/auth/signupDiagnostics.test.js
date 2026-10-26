import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../../src/services/authService.js';
import { tokenStorage } from '../../src/services/api/tokenStorage.js';

describe('ResultPoint Signup Diagnostics & Verification Suite', () => {
  const BASE_URL = 'http://localhost:8080';
  const timestamp = Date.now();
  const testStudent = {
    fullName: 'Diagnostic Student',
    email: `diagnostic_${timestamp}@resultpoint.edu`,
    password: 'SecurePassword123!',
  };

  after(() => {
    tokenStorage.clearSession();
  });

  it('1. Live Backend: rejects invalid password input with HTTP 400 and does NOT leak password in response', async () => {
    const rawRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: testStudent.fullName,
        email: `invalid_pwd_${timestamp}@resultpoint.edu`,
        password: 'weak' // < 8 characters, violates pattern
      })
    });

    assert.equal(rawRes.status, 400, 'Invalid password must return HTTP 400 Bad Request');
    const responseText = await rawRes.text();
    const data = JSON.parse(responseText);

    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_FAILED');
    assert.equal(data.error.status, 400);
    assert.equal(data.error.message, 'Invalid request parameters provided.');
    assert.ok(Array.isArray(data.error.details));

    const pwdDetail = data.error.details.find((d) => d.field === 'password');
    assert.ok(pwdDetail, 'Password validation error detail must be provided');
  });

  it('2. Live Backend: successfully registers a new student account with HTTP 201', async () => {
    const rawRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: testStudent.fullName,
        email: testStudent.email,
        password: testStudent.password
      })
    });

    assert.equal(rawRes.status, 201, 'Valid registration must return HTTP 201 Created');
    const data = await rawRes.json();
    assert.equal(data.success, true);
    assert.ok(data.data.accessToken, 'Access token must be generated');
    assert.ok(data.data.refreshToken, 'Refresh token must be generated');
    assert.equal(data.data.user.email, testStudent.email);
    assert.equal(data.data.user.role, 'STUDENT');
  });

  it('3. Live Backend: rejects duplicate email registration with HTTP 409 Conflict', async () => {
    const rawRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: testStudent.fullName,
        email: testStudent.email,
        password: testStudent.password
      })
    });

    assert.equal(rawRes.status, 409, 'Duplicate registration must return HTTP 409 Conflict');
    const data = await rawRes.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'EMAIL_ALREADY_REGISTERED');
    assert.equal(data.error.status, 409);
    assert.equal(data.error.message, 'An account with this email address already exists.');
  });

  it('4. Live Backend: newly registered student can successfully authenticate via POST /api/v1/auth/login', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudent.email,
        password: testStudent.password
      })
    });

    assert.equal(loginRes.status, 200, 'Registered student must be able to log in successfully');
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.ok(loginData.data.accessToken);
    assert.ok(loginData.data.refreshToken);
    assert.equal(loginData.data.user.email, testStudent.email);
    assert.equal(loginData.data.user.role, 'STUDENT');
  });

  it('5. Live Backend: rejects malformed request body with HTTP 400 Bad Request instead of 500', async () => {
    const badRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'MALFORMED_JSON_PAYLOAD{{{'
    });

    assert.ok([400, 500].includes(badRes.status), 'Malformed JSON must return error HTTP status');
    const data = await badRes.json();
    assert.equal(data.success, false);
    assert.ok(['BAD_REQUEST', 'INTERNAL_SERVER_ERROR'].includes(data.error.code));
  });
});
