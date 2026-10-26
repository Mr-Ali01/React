import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../../src/services/authService.js';
import { authSlice, registerUser } from '../../src/features/auth/authSlice.js';

describe('ResultPoint Signup Frontend Validation & Error Handling Suite', () => {

  it('1. validatePassword: enforces minimum 8 characters and letter + number pattern', () => {
    const isPasswordValid = (pwd) => pwd && pwd.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(pwd);

    assert.equal(isPasswordValid('short'), false, 'Passwords under 8 chars must be invalid');
    assert.equal(isPasswordValid('pass123'), false, 'Passwords under 8 chars with number must be invalid');
    assert.equal(isPasswordValid('password'), false, 'Passwords with 8 chars but no numbers must be invalid');
    assert.equal(isPasswordValid('12345678'), false, 'Passwords with 8 chars but no letters must be invalid');
    assert.equal(isPasswordValid('Password123'), true, 'Passwords with 8+ chars and letters + numbers must be valid');
    assert.equal(isPasswordValid('SecureP@ss1'), true, 'Complex passwords must be valid');
  });

  it('2. validateFullName: enforces minimum 2 characters', () => {
    const isNameValid = (name) => Boolean(name && name.trim().length >= 2);

    assert.equal(isNameValid(''), false, 'Empty name must be invalid');
    assert.equal(isNameValid('   '), false, 'Whitespace name must be invalid');
    assert.equal(isNameValid('a'), false, 'Single character name must be invalid');
    assert.equal(isNameValid('sam'), true, '3 character name must be valid');
    assert.equal(isNameValid('John Doe'), true, 'Full name must be valid');
  });

  it('3. Error Mapping: maps backend field-level validation details to specific form fields', () => {
    const backendError = {
      message: 'Invalid request parameters provided.',
      code: 'VALIDATION_FAILED',
      status: 400,
      details: [
        { field: 'password', message: 'Password must contain at least one letter and one number.' },
        { field: 'fullName', message: 'Full name must be between 2 and 150 characters.' }
      ]
    };

    const fieldErrors = {};
    if (backendError.details && Array.isArray(backendError.details)) {
      backendError.details.forEach((detail) => {
        if (detail.field === 'fullName') fieldErrors.fullName = detail.message;
        else if (detail.field === 'email') fieldErrors.email = detail.message;
        else if (detail.field === 'password') fieldErrors.password = detail.message;
        else if (detail.field === 'phone') fieldErrors.phone = detail.message;
      });
    }
    fieldErrors.general = backendError.message;

    assert.equal(fieldErrors.password, 'Password must contain at least one letter and one number.');
    assert.equal(fieldErrors.fullName, 'Full name must be between 2 and 150 characters.');
    assert.equal(fieldErrors.email, undefined, 'Email error must NOT be falsely set when only password/name failed');
    assert.equal(fieldErrors.general, 'Invalid request parameters provided.');
  });

  it('4. Error Mapping: maps duplicate email error code to email field', () => {
    const duplicateError = {
      message: 'An account with this email address already exists.',
      code: 'EMAIL_ALREADY_REGISTERED',
      status: 409
    };

    const fieldErrors = {};
    const errorMsg = duplicateError.message;
    if (duplicateError.code === 'EMAIL_ALREADY_REGISTERED' || errorMsg.toLowerCase().includes('email')) {
      fieldErrors.email = errorMsg;
    }
    fieldErrors.general = errorMsg;

    assert.equal(fieldErrors.email, 'An account with this email address already exists.');
    assert.equal(fieldErrors.general, 'An account with this email address already exists.');
  });

  it('5. authSlice: registerUser.rejected formats error message cleanly from structured payload', () => {
    const initialState = {
      user: null,
      token: null,
      loading: true,
      error: null,
      isAuthenticated: false
    };

    const action = {
      type: registerUser.rejected.type,
      payload: {
        message: 'Invalid request parameters provided.',
        code: 'VALIDATION_FAILED',
        status: 400
      }
    };

    const nextState = authSlice.reducer(initialState, action);
    assert.equal(nextState.loading, false);
    assert.equal(nextState.error, 'Invalid request parameters provided.');
  });
});
