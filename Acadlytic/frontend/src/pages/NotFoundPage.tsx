import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-6xl font-extrabold text-slate-300">404</h1>
      <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        The requested URL was not found on this server. Return to the dashboard or system health check.
      </p>
      <div className="pt-4">
        <Link to="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
