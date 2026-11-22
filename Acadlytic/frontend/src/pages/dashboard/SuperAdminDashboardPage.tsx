import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Shield, Building2, Activity, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const SuperAdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <PageContainer
      title="Super Admin Portal"
      subtitle={`Welcome back, ${user?.firstName || 'System Administrator'}. Multi-tenant institutional management and platform oversight.`}
      maxWidth="7xl"
    >
      <div className="space-y-6">
        {/* Metric summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Colleges
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">Ready</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Phase 03 College Management
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Role
                </p>
                <p className="text-2xl font-bold text-sky-600 mt-1">
                  SUPER_ADMIN
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Full Platform Governance
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Session Security
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  Active
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              HTTP-Only Cookie Session
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User Scope
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  MVP Roles
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Super Admin & College Admin
            </p>
          </Card>
        </div>

        {/* Informational Panel */}
        <Card title="Platform Overview & Architecture Status">
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            The frontend foundation is fully connected to the Spring Boot 3 +
            MySQL 8 modular monolith backend. All mutating requests are
            safeguarded with Double Submit CSRF cookies (`X-XSRF-TOKEN`), and
            user authentication relies on stateful `ACADLYTIC_SID` HTTP-only
            session cookies.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};
