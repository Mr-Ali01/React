import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { authService } from '@/services/authService';
import { renderWithProviders } from './test-utils';

describe('8. Reset Password Client-Side Validation', () => {
  it('rejects passwords shorter than 12 characters client-side without calling backend', async () => {
    const user = userEvent.setup();
    const resetSpy = vi.spyOn(authService, 'resetPassword');

    renderWithProviders(
      <MemoryRouter
        initialEntries={['/auth/reset-password?token=valid-test-token']}
      >
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /set new password/i });

    // Too short (6 characters)
    await user.type(newPassInput, 'Short1!');
    await user.type(confirmInput, 'Short1!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 12 characters/i)
      ).toBeInTheDocument();
    });

    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('rejects passwords lacking uppercase, digit, or special character client-side', async () => {
    const user = userEvent.setup();
    const resetSpy = vi.spyOn(authService, 'resetPassword');

    renderWithProviders(
      <MemoryRouter
        initialEntries={['/auth/reset-password?token=valid-test-token']}
      >
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /set new password/i });

    // 14 characters but only lowercase and numbers (no uppercase, no special)
    await user.type(newPassInput, 'alllowercase1234');
    await user.type(confirmInput, 'alllowercase1234');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one uppercase letter/i)
      ).toBeInTheDocument();
    });

    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('rejects passwords where confirmation does not match', async () => {
    const user = userEvent.setup();
    const resetSpy = vi.spyOn(authService, 'resetPassword');

    renderWithProviders(
      <MemoryRouter
        initialEntries={['/auth/reset-password?token=valid-test-token']}
      >
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /set new password/i });

    await user.type(newPassInput, 'ValidPassword123!');
    await user.type(confirmInput, 'DifferentPassword456!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(resetSpy).not.toHaveBeenCalled();
  });
});
