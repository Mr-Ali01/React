import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Building2, CheckCircle2, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const CollegeAdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <PageContainer
      title="College Administrator Dashboard"
      subtitle={`Institution Portal for ${user?.collegeName || 'Affiliated College'} (${user?.collegeCode || 'COLLEGE'})`}
      maxWidth="7xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card title="College Status">
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  {user?.collegeApprovalStatus || 'APPROVED'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Institutional tenancy is active and isolated under college ID{' '}
                <span className="font-mono font-medium text-slate-900">{user?.collegeId || 1}</span>.
              </p>
            </div>
          </Card>

          <Card title="Authentication Context">
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <span>{user?.email}</span>
              </div>
              <p className="text-xs text-slate-500">
                Role: <span className="font-mono text-sky-600 font-semibold">{user?.role}</span>
              </p>
            </div>
          </Card>

          <Card title="Module Status">
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                <span>Academic Core</span>
              </div>
              <p className="text-xs text-slate-500">
                Departments, Programs &amp; Batches (Phase 04+).
              </p>
            </div>
          </Card>
        </div>

        <Card title="Next Phase Capabilities">
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            This dashboard shell establishes the institutional context for College Admins. Subsequent phases will wire department provisioning, student records, and longitudinal academic intelligence analytics.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};
