import React, { useState } from 'react';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationSuccessView } from '@/components/registration/RegistrationSuccessView';
import { CollegeRegistrationResponse } from '@/types';

export const RegisterCollegePage: React.FC = () => {
  const [successData, setSuccessData] =
    useState<CollegeRegistrationResponse | null>(null);

  if (successData) {
    return <RegistrationSuccessView registration={successData} />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Register Your Institution
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Begin your college onboarding by submitting institutional details and
          nominating your primary administrator.
        </p>
      </div>

      <RegistrationForm onSuccess={(data) => setSuccessData(data)} />
    </div>
  );
};
