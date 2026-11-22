import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export const RegisterCollegePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <Building2 className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          College Onboarding
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Institution registration and approval workflow foundation.
        </p>
      </div>

      <Alert variant="info" title="Foundation Ready">
        The college onboarding flow integrates with Phase 03 multi-tenant
        college management backend services.
      </Alert>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
        <p className="font-semibold text-slate-800">
          Onboarding Process Steps:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Institution details &amp; university affiliation registration</li>
          <li>College administrator credentials creation</li>
          <li>Super Admin review and institutional verification</li>
          <li>Activation upon review approval</li>
        </ul>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link to="/auth/login">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
};
