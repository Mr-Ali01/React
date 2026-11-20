import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-md mx-auto my-12 text-center p-8 bg-white border border-red-200 rounded-2xl shadow-sm space-y-4">
      <div className="h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      <p className="text-sm text-slate-600">
        You do not have the required role permissions to view this resource.
      </p>

      {user && (
        <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 text-left space-y-1">
          <p>
            <span className="font-semibold text-slate-800">Current Role:</span> {user.role}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Account:</span> {user.email}
          </p>
        </div>
      )}

      <div className="pt-4 flex justify-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
