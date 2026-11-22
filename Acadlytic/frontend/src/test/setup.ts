import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  document.cookie = '';
});
