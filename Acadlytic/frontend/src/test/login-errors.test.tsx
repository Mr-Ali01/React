import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/api';
import { renderWithProviders } from './test-utils';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('2. Login Error Handling & Messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invalid credentials message on 401 with no redirect', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'login').mockRejectedValue(
      new ApiError('Invalid email or password.', {
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        status: 401,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      'admin@college.edu'
    );
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password.')
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows account locked message on AUTH_ACCOUNT_LOCKED with no redirect', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'login').mockRejectedValue(
      new ApiError('Account locked', {
        errorCode: 'AUTH_ACCOUNT_LOCKED',
        status: 429,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      'admin@college.edu'
    );
    await user.type(screen.getByLabelText(/password/i), 'GuessPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
        )
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
