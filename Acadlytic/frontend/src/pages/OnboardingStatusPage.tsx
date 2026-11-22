import React from 'react';
import { Clock, AlertCircle, Building2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

export const OnboardingStatusPage: React.FC = () => {
  const { user } = useAuthStore();

  const status = user?.collegeApprovalStatus || 'PENDING';

  return (
    <PageContainer
      title="College Onboarding Status"
      subtitle="Review the approval and verification progress of your affiliated institution."
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {status === 'PENDING' && (
          <Alert variant="warning" title="Application Under Review">
            Your college onboarding application has been submitted and is
            currently awaiting review by the Acadlytic Super Admin team.
          </Alert>
        )}

        {status === 'ACTION_REQUIRED' && (
          <Alert variant="error" title="Additional Information Required">
            The Super Admin team has requested further documentation or
            clarification before your college can be approved.
          </Alert>
        )}

        {status === 'REJECTED' && (
          <Alert variant="error" title="Application Not Approved">
            This onboarding registration could not be verified or approved.
            Please contact support.
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Institution Details">
            <div className="space-y-3 text-sm text-slate-600 mt-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <span>{user?.collegeName || 'Affiliated Institution'}</span>
              </div>
              <p>
                <span className="font-medium text-slate-700">
                  College Code:
                </span>{' '}
                <span className="font-mono text-slate-900">
                  {user?.collegeCode || 'PENDING'}
                </span>
              </p>
              <p>
                <span className="font-medium text-slate-700">
                  Administrator:
                </span>{' '}
                {user?.firstName} {user?.lastName} ({user?.email})
              </p>
            </div>
          </Card>

          <Card title="Current Lifecycle Stage">
            <div className="space-y-3 mt-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-slate-900">
                  Stage: Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full college management, department provisioning, and
                longitudinal academic records will unlock automatically once
                Super Admin review is completed.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Approval: {status}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
