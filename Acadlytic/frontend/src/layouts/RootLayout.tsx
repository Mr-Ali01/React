import React from 'react';
import { Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const RootLayout: React.FC = () => {
  // Bootstrap authentication session on initial application load
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" text="Initializing Acadlytic platform..." />
          <p className="text-xs text-slate-400 font-mono">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
