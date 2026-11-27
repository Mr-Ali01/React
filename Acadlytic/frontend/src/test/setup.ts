import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// Polyfill/stub window.URL createObjectURL and revokeObjectURL in JSDOM
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = () => 'blob:http://localhost/fake-doc-preview-url';
  window.URL.revokeObjectURL = () => {};
}

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  document.cookie = '';
});
