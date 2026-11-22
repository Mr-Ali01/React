import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { authService } from '@/services/authService';
import { renderWithProviders } from './test-utils';
import { CurrentUser } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('1. Login Success Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects SUPER_ADMIN to /admin/dashboard on successful login', async () => {
    const user = userEvent.setup();

    const mockSuperAdmin: CurrentUser = {
      id: 1,
      email: 'owner@acadlytic.com',
      firstName: 'System',
      lastName: 'Owner',
      role: 'SUPER_ADMIN',
      managementUnlocked: true,
      emailVerified: true,
    };

    vi.spyOn(authService, 'login').mockResolvedValue(mockSuperAdmin);
    vi.spyOn(authService, 'getMe').mockResolvedValue(mockSuperAdmin);

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'owner@acadlytic.com');
    await user.type(passwordInput, 'SuperAdmin@2026!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'owner@acadlytic.com',
        password: 'SuperAdmin@2026!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', {
        replace: true,
      });
    });
  });
});
