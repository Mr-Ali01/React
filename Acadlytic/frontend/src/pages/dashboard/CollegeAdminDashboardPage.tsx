import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuthStore } from '@/stores/authStore';
import { useMyApplication } from '@/hooks/useOnboarding';
import {
  CollegeActivationHeroBanner,
  ActivationMilestoneCard,
  InstitutionalReadinessRoadmapCard,
  ApprovedDossierModal,
} from '@/components/activation';

export const CollegeAdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: application, isLoading } = useMyApplication();
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const collegeName =
    user?.collegeName ||
    application?.currentRevision?.profile?.legalName ||
    application?.college?.name ||
    'Affiliated College';

  const collegeCode =
    user?.collegeCode || application?.college?.code || 'COLLEGE';

  const universityName =
    application?.currentRevision?.profile?.affiliatedUniversityName;

  const approvalStatus =
    user?.collegeApprovalStatus || application?.college?.approvalStatus || 'APPROVED';

  const collegeStatus =
    user?.collegeStatus || application?.college?.status || 'ACTIVE';

  const managementUnlocked = user?.managementUnlocked ?? true;

  return (
    <PageContainer
      title="College Administrator Dashboard"
      subtitle={`Institution Operational Portal for ${collegeName} (${collegeCode})`}
      maxWidth="7xl"
    >
      <div className="space-y-6">
        {/* Celebratory Hero Welcome Banner */}
        <CollegeActivationHeroBanner
          collegeName={collegeName}
          collegeCode={collegeCode}
          universityName={universityName}
          approvalStatus={approvalStatus}
          collegeStatus={collegeStatus}
          managementUnlocked={managementUnlocked}
        />

        {/* Milestone Card with Checklist & Dossier Trigger */}
        <ActivationMilestoneCard
          versionNumber={application?.currentRevision?.versionNumber ?? 1}
          reviewedAt={application?.reviewFeedback?.reviewedAt}
          reviewNotes={application?.reviewFeedback?.reviewNotes}
          checklist={application?.checklist}
          approvalStatus={approvalStatus}
          collegeStatus={collegeStatus}
          onOpenDossier={() => setIsDossierOpen(true)}
        />

        {/* Informational Phase 04+ Readiness Roadmap */}
        <InstitutionalReadinessRoadmapCard />

        {/* Read-Only Approved Dossier Modal */}
        <ApprovedDossierModal
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          application={application ?? null}
          isLoading={isLoading}
        />
      </div>
    </PageContainer>
  );
};
