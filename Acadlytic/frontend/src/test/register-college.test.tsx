import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterCollegePage } from '@/pages/auth/RegisterCollegePage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { collegeRegistrationService } from '@/services/collegeRegistrationService';
import { ApiError, isApiError, parseRetryAfter } from '@/services/api';
import { extractRetryAfter } from '@/hooks/useCollegeRegistration';
import { renderWithProviders } from './test-utils';
import {
  registerCollegeSchema,
  toRegisterCollegeRequest,
  RegisterCollegeFormValues,
} from '@/schemas/registrationSchema';
import { CollegeRegistrationResponse } from '@/types';

function createValidFormValues(
  overrides?: Partial<RegisterCollegeFormValues>
): RegisterCollegeFormValues {
  return {
    legalName: 'Horizon Institute of Science & Technology',
    code: 'horizon-tech',
    affiliatedUniversityName: 'State Technological University',
    websiteUrl: 'https://www.horizon.edu',
    contactPhone: '+1-555-0199',
    addressLine1: '100 Innovation Way',
    addressLine2: 'Suite 400',
    city: 'Metropolis',
    state: 'California',
    country: 'United States',
    postalCode: '90210',
    adminFirstName: 'Eleanor',
    adminLastName: 'Vane',
    adminEmail: 'admin@horizon.edu',
    password: 'correct horse battery staple',
    confirmPassword: 'correct horse battery staple',
    ...overrides,
  };
}

function fillRegistrationForm(overrides?: Partial<Record<string, string>>) {
  const values = {
    legalName: 'Horizon Institute of Science & Technology',
    code: 'horizon-tech',
    affiliatedUniversityName: 'State Technological University',
    contactPhone: '+1-555-0199',
    addressLine1: '100 Innovation Way',
    city: 'Metropolis',
    state: 'California',
    country: 'United States',
    postalCode: '90210',
    adminFirstName: 'Eleanor',
    adminLastName: 'Vane',
    adminEmail: 'admin@horizon.edu',
    password: 'correct horse battery staple',
    confirmPassword: 'correct horse battery staple',
    ...overrides,
  };

  fireEvent.change(screen.getByLabelText(/college legal name/i), {
    target: { value: values.legalName },
  });
  fireEvent.change(screen.getByLabelText(/college code/i), {
    target: { value: values.code },
  });
  fireEvent.change(screen.getByLabelText(/affiliated university name/i), {
    target: { value: values.affiliatedUniversityName },
  });
  fireEvent.change(screen.getByLabelText(/contact phone/i), {
    target: { value: values.contactPhone },
  });
  fireEvent.change(screen.getByLabelText(/address line 1/i), {
    target: { value: values.addressLine1 },
  });
  fireEvent.change(screen.getByLabelText(/^city/i), {
    target: { value: values.city },
  });
  fireEvent.change(screen.getByLabelText(/state \/ province/i), {
    target: { value: values.state },
  });
  fireEvent.change(screen.getByLabelText(/^country/i), {
    target: { value: values.country },
  });
  fireEvent.change(screen.getByLabelText(/postal \/ pin code/i), {
    target: { value: values.postalCode },
  });
  fireEvent.change(screen.getByLabelText(/administrator first name/i), {
    target: { value: values.adminFirstName },
  });
  fireEvent.change(screen.getByLabelText(/administrator last name/i), {
    target: { value: values.adminLastName },
  });
  fireEvent.change(screen.getByLabelText(/administrator official email/i), {
    target: { value: values.adminEmail },
  });
  fireEvent.change(screen.getByLabelText(/^password/i), {
    target: { value: values.password },
  });
  fireEvent.change(screen.getByLabelText(/^confirm password/i), {
    target: { value: values.confirmPassword },
  });
}

describe('Module 3.1B — Public College Registration Portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: All 16 controls render
  // --------------------------------------------------------------------------
  it('1. renders all 16 controls (15 payload fields + 1 confirmPassword)', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    // Section 1: Institution Details (5)
    expect(screen.getByLabelText(/college legal name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/college code/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/affiliated university name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/official website url/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();

    // Section 2: Campus Address & Location (6)
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state \/ province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal \/ pin code/i)).toBeInTheDocument();

    // Section 3: Primary Administrator Account (5)
    expect(
      screen.getByLabelText(/administrator first name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/administrator last name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/administrator official email/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password/i)).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole('button', { name: /submit registration application/i })
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Three registration sections render
  // --------------------------------------------------------------------------
  it('2. renders all three registration sections with headers', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Institution Details')).toBeInTheDocument();
    expect(
      screen.getByText('Campus Address & Location')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Primary Administrator Account')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Required fields reject whitespace-only values
  // --------------------------------------------------------------------------
  it('3. schema rejects whitespace-only values for required fields', () => {
    const whitespaceValues = createValidFormValues({
      legalName: '   ',
      code: '   ',
      affiliatedUniversityName: '   ',
      contactPhone: '   ',
      addressLine1: '   ',
      city: '   ',
      state: '   ',
      country: '   ',
      postalCode: '   ',
      adminFirstName: '   ',
      adminLastName: '   ',
      adminEmail: '   ',
    });

    const result = registerCollegeSchema.safeParse(whitespaceValues);
    expect(result.success).toBe(false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.legalName).toBeDefined();
      expect(fieldErrors.code).toBeDefined();
      expect(fieldErrors.affiliatedUniversityName).toBeDefined();
      expect(fieldErrors.contactPhone).toBeDefined();
      expect(fieldErrors.addressLine1).toBeDefined();
      expect(fieldErrors.city).toBeDefined();
      expect(fieldErrors.state).toBeDefined();
      expect(fieldErrors.country).toBeDefined();
      expect(fieldErrors.postalCode).toBeDefined();
      expect(fieldErrors.adminFirstName).toBeDefined();
      expect(fieldErrors.adminLastName).toBeDefined();
      expect(fieldErrors.adminEmail).toBeDefined();
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 4: College code validation and uppercase serialization
  // --------------------------------------------------------------------------
  it('4. validates college code pattern and serializes to uppercase', () => {
    const invalidCodeValues = createValidFormValues({
      code: 'HORIZON TECH!',
    });
    const invalidResult = registerCollegeSchema.safeParse(invalidCodeValues);
    expect(invalidResult.success).toBe(false);

    const validValues = createValidFormValues({
      code: '  horizon-tech_01  ',
    });
    const parsed = registerCollegeSchema.safeParse(validValues);
    expect(parsed.success).toBe(true);

    const payload = toRegisterCollegeRequest(validValues);
    expect(payload.code).toBe('HORIZON-TECH_01');
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Password length validation
  // --------------------------------------------------------------------------
  it('5. enforces password length between 12 and 128 characters', () => {
    const shortValues = createValidFormValues({
      password: 'short123',
      confirmPassword: 'short123',
    });
    const shortResult = registerCollegeSchema.safeParse(shortValues);
    expect(shortResult.success).toBe(false);

    const exact12 = createValidFormValues({
      password: '123456789012',
      confirmPassword: '123456789012',
    });
    const exact12Result = registerCollegeSchema.safeParse(exact12);
    expect(exact12Result.success).toBe(true);

    const over128 = 'a'.repeat(129);
    const overResult = registerCollegeSchema.safeParse(
      createValidFormValues({
        password: over128,
        confirmPassword: over128,
      })
    );
    expect(overResult.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Password/email containment validation
  // --------------------------------------------------------------------------
  it('6. rejects password if it contains administrator email case-insensitively', () => {
    const containingValues = createValidFormValues({
      adminEmail: 'Admin@Horizon.edu',
      password: 'PassADMIN@HORIZON.EDU123',
      confirmPassword: 'PassADMIN@HORIZON.EDU123',
    });

    const result = registerCollegeSchema.safeParse(containingValues);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(
        /must not contain your email address/i
      );
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Valid passphrases without mandatory character classes
  // --------------------------------------------------------------------------
  it('7. accepts valid passphrases without forced uppercase/digits/symbols', () => {
    const passphraseValues = createValidFormValues({
      password: 'correct horse battery staple',
      confirmPassword: 'correct horse battery staple',
    });

    const result = registerCollegeSchema.safeParse(passphraseValues);
    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Confirmation password mismatch
  // --------------------------------------------------------------------------
  it('8. rejects submission when password and confirmPassword do not match', () => {
    const mismatchValues = createValidFormValues({
      password: 'correct horse battery staple',
      confirmPassword: 'completely different password',
    });

    const result = registerCollegeSchema.safeParse(mismatchValues);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(
        /passwords do not match/i
      );
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Exact 15-field API payload; confirmPassword excluded
  // --------------------------------------------------------------------------
  it('9. toRegisterCollegeRequest produces exact 15 fields and excludes confirmPassword', () => {
    const formValues = createValidFormValues();
    const payload = toRegisterCollegeRequest(formValues);

    expect(payload).not.toHaveProperty('confirmPassword');
    expect(Object.keys(payload)).toHaveLength(15);
    expect(payload).toEqual({
      legalName: 'Horizon Institute of Science & Technology',
      code: 'HORIZON-TECH',
      affiliatedUniversityName: 'State Technological University',
      websiteUrl: 'https://www.horizon.edu',
      contactPhone: '+1-555-0199',
      addressLine1: '100 Innovation Way',
      addressLine2: 'Suite 400',
      city: 'Metropolis',
      state: 'California',
      country: 'United States',
      postalCode: '90210',
      adminFirstName: 'Eleanor',
      adminLastName: 'Vane',
      adminEmail: 'admin@horizon.edu',
      password: 'correct horse battery staple',
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Optional blank fields serialized as null
  // --------------------------------------------------------------------------
  it('10. serializes blank or whitespace-only optional fields to null', () => {
    const valuesWithBlankOptionals = createValidFormValues({
      websiteUrl: '   ',
      addressLine2: '',
    });

    const payload = toRegisterCollegeRequest(valuesWithBlankOptionals);
    expect(payload.websiteUrl).toBeNull();
    expect(payload.addressLine2).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Password is preserved without trimming
  // --------------------------------------------------------------------------
  it('11. preserves raw password spacing exactly without trimming', () => {
    const valuesWithRawPassword = createValidFormValues({
      password: '  passphrase with leading spaces  ',
      confirmPassword: '  passphrase with leading spaces  ',
    });

    const payload = toRegisterCollegeRequest(valuesWithRawPassword);
    expect(payload.password).toBe('  passphrase with leading spaces  ');
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Successful HTTP 201 transition to success view
  // --------------------------------------------------------------------------
  it('12. transitions to RegistrationSuccessView on HTTP 201 response', async () => {
    const mockResponse: CollegeRegistrationResponse = {
      collegeId: 101,
      registrationId: 201,
      versionNumber: 1,
      collegeName: 'Horizon Institute of Science & Technology',
      collegeCode: 'HORIZON-TECH',
      status: 'PENDING',
      adminEmail: 'admin@horizon.edu',
      submittedForReview: false,
    };

    vi.spyOn(collegeRegistrationService, 'registerCollege').mockResolvedValue(
      mockResponse
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm();

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /application received/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/check your inbox and spam folder/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/48-hour expiration:/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /proceed to sign in/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Duplicate college code error mapping
  // --------------------------------------------------------------------------
  it('13. maps COLLEGE_CODE_ALREADY_EXISTS conflict error to code input', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('An active college with this college code already exists.', {
        errorCode: 'COLLEGE_CODE_ALREADY_EXISTS',
        status: 409,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'DUP-CODE' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('This college code is already registered.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('College Code Unavailable')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Duplicate administrator email error mapping
  // --------------------------------------------------------------------------
  it('14. maps EMAIL_ALREADY_EXISTS conflict error to adminEmail input with sign-in link', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('An active account with this email address already exists.', {
        errorCode: 'EMAIL_ALREADY_EXISTS',
        status: 409,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ adminEmail: 'existing@college.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/an active account with this email address already exists/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /sign in to your account/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Backend password denylist rejection
  // --------------------------------------------------------------------------
  it('15. maps PASSWORD_POLICY_VIOLATION server denial to password field', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError(
        'This password is too common or has appeared in known breaches. Please choose a stronger password.',
        {
          errorCode: 'PASSWORD_POLICY_VIOLATION',
          status: 400,
        }
      )
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({
      password: 'password12345678',
      confirmPassword: 'password12345678',
    });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getAllByText(/this password is too common or has appeared in known breaches/i)[0]
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Valid Retry-After countdown
  // --------------------------------------------------------------------------
  it('16. displays countdown timer and disables submission when Retry-After is valid', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('Rate limit exceeded', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        status: 429,
        retryAfter: 60,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'RATE-TEST', adminEmail: 'admin@rate.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/too many registration requests from this ip address/i)
      ).toBeInTheDocument();
      expect(screen.getByText('60 seconds')).toBeInTheDocument();
    });

    expect(submitBtn).toBeDisabled();

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText('30 seconds')).toBeInTheDocument();

    // Advance remaining 30 seconds
    act(() => {
      vi.advanceTimersByTime(31000);
    });

    expect(
      screen.queryByText(/too many registration requests from this ip address/i)
    ).not.toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Missing/invalid Retry-After workflow: warning, dismiss, retry, and subsequent 429
  // --------------------------------------------------------------------------
  it('17. missing Retry-After displays warning without countdown, allows dismissal, allows retry, and handles subsequent 429', async () => {
    const registerSpy = vi
      .spyOn(collegeRegistrationService, 'registerCollege')
      .mockRejectedValueOnce(
        new ApiError('Rate limit exceeded', {
          errorCode: 'RATE_LIMIT_EXCEEDED',
          status: 429,
        })
      )
      .mockRejectedValueOnce(
        new ApiError('Rate limit exceeded', {
          errorCode: 'RATE_LIMIT_EXCEEDED',
          status: 429,
        })
      )
      .mockRejectedValueOnce(
        new ApiError('Rate limit exceeded', {
          errorCode: 'RATE_LIMIT_EXCEEDED',
          status: 429,
          retryAfter: 30,
        })
      );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'NO-RETRY', adminEmail: 'admin@noretry.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });

    // 17.1: First submit attempt
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Must NOT display an invented countdown (e.g. 3600 or 60 seconds)
      expect(
        screen.queryByText(/seconds before trying again/i)
      ).not.toBeInTheDocument();

      // Displays persistent message
      expect(
        screen.getByText(/please wait a while before retrying/i)
      ).toBeInTheDocument();
    });

    // Submit button remains enabled (user is not permanently trapped)
    expect(submitBtn).not.toBeDisabled();
    expect(registerSpy).toHaveBeenCalledTimes(1);

    // 17.2: Dismiss action clears warning
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(/please wait a while before retrying/i)
    ).not.toBeInTheDocument();

    // 17.3: Subsequent retry attempt triggers second registration call
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText(/please wait a while before retrying/i)
      ).toBeInTheDocument();
    });

    // 17.4: Dismiss again and submit a third time (where valid Retry-After: 30 is returned)
    const dismissBtn2 = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn2);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledTimes(3);
      expect(
        screen.getByText(/too many registration requests from this ip address/i)
      ).toBeInTheDocument();
      expect(screen.getByText('30 seconds')).toBeInTheDocument();
    });

    // Valid countdown disables submit button
    expect(submitBtn).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // Scenario 17b: Malformed Retry-After header ("30abc") handling
  // --------------------------------------------------------------------------
  it('17b. malformed Retry-After header ("30abc") displays warning without fabricated countdown, leaves submit button enabled, and allows dismiss and retry', async () => {
    // Malformed Axios-like 429 error where retry-after is "30abc"
    const malformedAxiosError = {
      name: 'ApiError',
      message: 'Rate limit exceeded',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      response: {
        status: 429,
        headers: {
          'retry-after': '30abc',
        },
      },
    };

    const registerSpy = vi
      .spyOn(collegeRegistrationService, 'registerCollege')
      .mockRejectedValueOnce(malformedAxiosError)
      .mockResolvedValueOnce({
        collegeId: 101,
        registrationId: 501,
        versionNumber: 1,
        collegeName: 'Horizon Institute',
        collegeCode: 'MALFORM-RETRY',
        status: 'PENDING',
        adminEmail: 'admin@malform.edu',
        submittedForReview: false,
      });

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'MALFORM-RETRY', adminEmail: 'admin@malform.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Must NOT display an invented countdown
      expect(
        screen.queryByText(/seconds before trying again/i)
      ).not.toBeInTheDocument();
      // Displays persistent rate limit warning
      expect(
        screen.getByText(/please wait a while before retrying/i)
      ).toBeInTheDocument();
    });

    // Submit button remains enabled (user is not locked out)
    expect(submitBtn).not.toBeDisabled();
    expect(registerSpy).toHaveBeenCalledTimes(1);

    // User can dismiss and retry
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(/please wait a while before retrying/i)
    ).not.toBeInTheDocument();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Application Received')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 18: CSRF error behavior after interceptor retry is exhausted
  // --------------------------------------------------------------------------
  it('18. displays security token alert when CSRF retry is exhausted', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('CSRF token invalid', {
        errorCode: 'CSRF_TOKEN_INVALID',
        status: 403,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'CSRF-CODE', adminEmail: 'admin@csrf.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/security token error/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/your security token expired/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 19: Loading state prevents duplicate submissions
  // --------------------------------------------------------------------------
  it('19. disables inputs and submit button during in-flight submission', async () => {
    let resolvePromise: (val: CollegeRegistrationResponse) => void;
    const pendingPromise = new Promise<CollegeRegistrationResponse>(
      (resolve) => {
        resolvePromise = resolve;
      }
    );

    vi.spyOn(collegeRegistrationService, 'registerCollege').mockImplementation(
      () => pendingPromise
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm({ code: 'LOAD-CODE', adminEmail: 'admin@load.edu' });

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
      expect(screen.getByLabelText(/college legal name/i)).toBeDisabled();
    });

    await act(async () => {
      resolvePromise!({
        collegeId: 1,
        registrationId: 1,
        versionNumber: 1,
        collegeName: 'Horizon Institute',
        collegeCode: 'LOAD-CODE',
        status: 'PENDING',
        adminEmail: 'admin@load.edu',
        submittedForReview: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Application Received')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 20: Existing auth routes and layout behavior remain unaffected
  // --------------------------------------------------------------------------
  it('20. AuthLayout expands to sm:max-w-3xl on register-college and retains sm:max-w-md on other auth routes', () => {
    const { container: loginContainer } = renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const loginOutletWrapper = loginContainer.querySelector('.sm\\:max-w-md');
    expect(loginOutletWrapper).toBeInTheDocument();

    const { container: regContainer } = renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route
              path="/auth/register-college"
              element={<div>Registration Page</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const regOutletWrapper = regContainer.querySelector('.sm\\:max-w-3xl');
    expect(regOutletWrapper).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 21: VALIDATION_ERROR field-level mapping through setError
  // --------------------------------------------------------------------------
  it('21. maps server VALIDATION_ERROR field errors to individual form controls', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('Validation failed', {
        errorCode: 'VALIDATION_ERROR',
        status: 400,
        errors: {
          legalName: 'College legal name must not exceed 255 characters',
          contactPhone: 'Contact phone must not exceed 50 characters',
        },
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm();

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Validation Failed')).toBeInTheDocument();
      expect(
        screen.getByText('College legal name must not exceed 255 characters')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Contact phone must not exceed 50 characters')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 22: Network failure handling
  // --------------------------------------------------------------------------
  it('22. displays Connection Error alert when unexpected network failure occurs', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new Error('Network Error: Failed to fetch')
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm();

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(
        screen.getByText(
          /unable to reach the acadlytic platform\. please verify your internet connection/i
        )
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 23: Unexpected server error handling (500)
  // --------------------------------------------------------------------------
  it('23. displays Registration Error alert when unexpected 500 server error occurs', async () => {
    vi.spyOn(collegeRegistrationService, 'registerCollege').mockRejectedValue(
      new ApiError('An internal error occurred. Please contact support.', {
        errorCode: 'INTERNAL_ERROR',
        status: 500,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/register-college']}>
        <RegisterCollegePage />
      </MemoryRouter>
    );

    fillRegistrationForm();

    const submitBtn = screen.getByRole('button', {
      name: /submit registration application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Registration Error')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An internal error occurred. Please contact support.'
        )
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 24: Shared API client regression safety & strict isApiError validation
  // --------------------------------------------------------------------------
  it('24. verifies isApiError strictly validates error instances across all 5 prototype-boundary conditions', () => {
    // Condition 1: Genuine ApiError instance recognized
    const genuineError = new ApiError('Rate limit reached', {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      retryAfter: 120,
    });
    expect(genuineError.message).toBe('Rate limit reached');
    expect(genuineError.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    expect(genuineError.status).toBe(429);
    expect(genuineError.retryAfter).toBe(120);
    expect(isApiError(genuineError)).toBe(true);
    expect(isApiError(new ApiError('Simple error'))).toBe(true);

    // Condition 2: Structurally valid cross-boundary error recognized
    const validCrossBoundary = {
      name: 'ApiError',
      message: 'Authentication failed',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
      status: 401,
    };
    expect(isApiError(validCrossBoundary)).toBe(true);

    const validCrossBoundaryMinimal = {
      name: 'ApiError',
      message: 'Valid minimal error',
    };
    expect(isApiError(validCrossBoundaryMinimal)).toBe(true);

    // Condition 3: Arbitrary object containing only errorCode is strictly rejected
    const arbitraryWithErrorCode = { errorCode: 'RATE_LIMIT_EXCEEDED' };
    expect(isApiError(arbitraryWithErrorCode)).toBe(false);

    const arbitraryWithErrorCodeAndExtra = {
      errorCode: 'AUTH_INVALID_CREDENTIALS',
      status: 401,
      foo: 'bar',
    };
    expect(isApiError(arbitraryWithErrorCodeAndExtra)).toBe(false);

    // Condition 4: Unrelated object named 'ApiError' missing required fields or types is strictly rejected
    expect(isApiError({ name: 'ApiError' })).toBe(false); // missing message
    expect(isApiError({ name: 'ApiError', message: 12345 })).toBe(false); // message not string
    expect(
      isApiError({ name: 'ApiError', message: 'Fail', errorCode: 999 })
    ).toBe(false); // errorCode not string
    expect(
      isApiError({ name: 'ApiError', message: 'Fail', status: '400' })
    ).toBe(false); // status not number

    // Condition 5: null, undefined, primitive strings/numbers, standard Error rejected
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('string error')).toBe(false);
    expect(isApiError(42)).toBe(false);
    expect(isApiError(true)).toBe(false);
    expect(isApiError(new Error('Standard Error'))).toBe(false);
    expect(isApiError(new TypeError('Type Error'))).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 25: Strict Retry-After parsing and extraction
  // --------------------------------------------------------------------------
  it('25. verifies parseRetryAfter and extractRetryAfter strictly parse retry durations and reject non-integers', () => {
    // parseRetryAfter: Accepts positive integer string and number
    expect(parseRetryAfter('30')).toBe(30);
    expect(parseRetryAfter(30)).toBe(30);
    expect(parseRetryAfter(' 30 ')).toBe(30);
    expect(parseRetryAfter(['30'])).toBe(30);

    // parseRetryAfter: Rejects non-integer prefixes, suffixes, and non-numeric strings
    expect(parseRetryAfter('30abc')).toBe(null);
    expect(parseRetryAfter('abc30')).toBe(null);
    expect(parseRetryAfter('abc')).toBe(null);
    expect(parseRetryAfter('')).toBe(null);
    expect(parseRetryAfter('   ')).toBe(null);

    // parseRetryAfter: Rejects zero and negative numbers/strings
    expect(parseRetryAfter('0')).toBe(null);
    expect(parseRetryAfter(0)).toBe(null);
    expect(parseRetryAfter('-1')).toBe(null);
    expect(parseRetryAfter(-1)).toBe(null);
    expect(parseRetryAfter(30.5)).toBe(null);

    // parseRetryAfter: Rejects null, undefined, objects
    expect(parseRetryAfter(null)).toBe(null);
    expect(parseRetryAfter(undefined)).toBe(null);
    expect(parseRetryAfter({})).toBe(null);
    expect(parseRetryAfter(['30abc'])).toBe(null);

    // extractRetryAfter: Valid ApiError retryAfter property
    const errWithValidRetry = new ApiError('Rate limit', {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      retryAfter: 45,
    });
    expect(extractRetryAfter(errWithValidRetry)).toBe(45);

    // extractRetryAfter: ApiError with invalid/zero retryAfter property
    const errWithZeroRetry = new ApiError('Rate limit', {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      retryAfter: 0,
    });
    expect(extractRetryAfter(errWithZeroRetry)).toBe(null);

    // extractRetryAfter: Axios response headers format
    const axiosErrorWithValidHeader = {
      response: {
        headers: {
          'retry-after': '60',
        },
      },
    };
    expect(extractRetryAfter(axiosErrorWithValidHeader)).toBe(60);

    const axiosErrorWithMalformedHeader = {
      response: {
        headers: {
          'retry-after': '60abc',
        },
      },
    };
    expect(extractRetryAfter(axiosErrorWithMalformedHeader)).toBe(null);

    const axiosErrorWithZeroHeader = {
      response: {
        headers: {
          'retry-after': '0',
        },
      },
    };
    expect(extractRetryAfter(axiosErrorWithZeroHeader)).toBe(null);

    const axiosErrorWithMissingHeader = {
      response: {
        headers: {},
      },
    };
    expect(extractRetryAfter(axiosErrorWithMissingHeader)).toBe(null);

    expect(extractRetryAfter(null)).toBe(null);
    expect(extractRetryAfter(undefined)).toBe(null);
  });
});
