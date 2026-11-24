import React from 'react';

interface RegistrationSectionHeaderProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const RegistrationSectionHeader: React.FC<
  RegistrationSectionHeaderProps
> = ({ stepNumber, title, description, icon }) => {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-slate-200 mb-4">
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm shadow-sm">
        {icon || stepNumber}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
};
