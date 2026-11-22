import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { router } from './routes';
import { registerSessionPurgeHandler, isApiError } from '@/services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        let status: number | undefined;
        if (isApiError(error)) {
          status = error.status;
        } else if (axios.isAxiosError(error)) {
          status = error.response?.status;
        }

        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Purge query cache when an authenticated session expires
registerSessionPurgeHandler(() => {
  queryClient.clear();
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
