import React from 'react';
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CollegeActivationHeroBannerProps {
  collegeName?: string | null;
  collegeCode?: string | null;
  universityName?: string | null;
  approvalStatus?: string | null;
  collegeStatus?: string | null;
  managementUnlocked?: boolean;
}

export const CollegeActivationHeroBanner: React.FC<
  CollegeActivationHeroBannerProps
> = ({
  collegeName,
  collegeCode,
  universityName,
  approvalStatus = 'APPROVED',
  collegeStatus = 'ACTIVE',
  managementUnlocked = true,
}) => {
  const displayName = collegeName || 'Affiliated Institution';
  const displayCode = collegeCode || 'COLLEGE';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-lg border border-indigo-700/40">
      {/* Decorative ambient background accents */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Celebration Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Institution Fully Activated</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome to Acadlytic, {displayName}!
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Your institution registration has been thoroughly reviewed and officially approved by the Super Admin team. Operational capabilities and institutional academic management are unlocked.
          </p>
        </div>

        {/* Credentials & Institutional Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-indigo-700/40">
          {/* Institutional Identifier (Canonical code) */}
          <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 space-y-1">
            <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              Permanent College Code
            </span>
            <div className="font-mono text-base font-bold text-white tracking-wide">
              {displayCode}
            </div>
          </div>

          {/* University Affiliation */}
          <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 space-y-1">
            <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              University Affiliation
            </span>
            <div className="text-sm font-semibold text-white truncate">
              {universityName || 'Affiliated University'}
            </div>
          </div>

          {/* Operational Status */}
          <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 space-y-1">
            <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Operational Tenancy
            </span>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Status: {collegeStatus}
              </span>
            </div>
          </div>

          {/* Access Authorization */}
          <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 space-y-1">
            <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Management Access
            </span>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                {managementUnlocked ? 'UNLOCKED' : 'LOCKED'} ({approvalStatus})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
