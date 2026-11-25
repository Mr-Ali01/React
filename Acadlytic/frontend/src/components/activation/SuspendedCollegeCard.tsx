import React from 'react';
import { Building2, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SuspendedCollegeCardProps {
  status?: 'COLLEGE_SUSPENDED' | 'COLLEGE_INACTIVE' | 'SUSPENDED' | 'INACTIVE' | string;
  errorMessage?: string;
  onReturnToLogin?: () => void;
}

export const SuspendedCollegeCard: React.FC<SuspendedCollegeCardProps> = ({
  status = 'COLLEGE_SUSPENDED',
  errorMessage,
  onReturnToLogin,
}) => {
  const isInactive =
    status === 'COLLEGE_INACTIVE' ||
    status === 'INACTIVE' ||
    status === 'ARCHIVED';

  const handleLoginClick = () => {
    if (onReturnToLogin) {
      onReturnToLogin();
    } else {
      window.location.href = '/auth/login';
    }
  };

  return (
    <div
      className={`rounded-2xl border p-8 text-center space-y-6 my-8 max-w-2xl mx-auto shadow-sm ${
        isInactive
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-amber-50/60 border-amber-200 text-amber-900'
      }`}
    >
      <div
        className={`inline-flex p-3 rounded-full ${
          isInactive
            ? 'bg-slate-200 text-slate-700'
            : 'bg-amber-100 text-amber-600'
        }`}
      >
        {isInactive ? (
          <Building2 className="h-10 w-10" />
        ) : (
          <ShieldAlert className="h-10 w-10" />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {isInactive
            ? 'Institution Account Inactive'
            : 'Institution Account Suspended'}
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          {errorMessage ||
            (isInactive
              ? 'This college account is currently inactive or has been archived. Operational access and academic capabilities are paused.'
              : 'This college account has been suspended by the platform administration. Operational and academic capabilities are temporarily paused.')}
        </p>
      </div>

      <div className="bg-white/80 border border-slate-200 rounded-xl p-4 text-xs max-w-md mx-auto text-left space-y-1.5 shadow-xs">
        <div className="font-semibold flex items-center gap-1.5 text-slate-800">
          <ShieldAlert className="h-4 w-4 text-indigo-600" />
          <span>Support Contact &amp; Resolution:</span>
        </div>
        <p className="text-slate-600">
          To inquire about your institution&apos;s status or request reactivation, please reach out to your designated platform Super Administrator.
        </p>
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleLoginClick}
          className="text-xs flex items-center gap-1.5 mx-auto"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Return to Login</span>
        </Button>
      </div>
    </div>
  );
};
