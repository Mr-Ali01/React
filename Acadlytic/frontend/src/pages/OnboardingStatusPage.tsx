import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ResendVerificationButton } from '@/components/verification/ResendVerificationButton';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { queryKeys } from '@/services/queryKeys';
import {
  isApplicationFrozenInReview,
  isDraftEditable,
  useCreateCorrectionDraft,
  useDeleteDocument,
  useMyApplication,
  useSubmitApplication,
} from '@/hooks/useOnboarding';
import {
  CollegeProfileCard,
  DocumentManagementSection,
  DocumentUploadModal,
  EditProfileModal,
  OnboardingChecklistCard,
  OnboardingStatusBanner,
  ReviewFeedbackCard,
  RevisionHistoryDrawer,
  SubmitApplicationModal,
} from '@/components/onboarding';
import { SuspendedCollegeCard } from '@/components/activation/SuspendedCollegeCard';
import { DocumentResponse } from '@/types';
import { isApiError } from '@/services/api';

export const OnboardingStatusPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal and drawer UI states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [replacingDoc, setReplacingDoc] = useState<DocumentResponse | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 1. If user is already approved and active, route immediately to active college dashboard
  const isApproved = user?.collegeApprovalStatus === 'APPROVED';
  const isActive = user?.collegeStatus === 'ACTIVE';
  const isUnlocked = user?.managementUnlocked === true;

  if (isApproved && isActive && isUnlocked) {
    return <Navigate to="/college/dashboard" replace />;
  }

  // 2. Fetch the authoritative restricted dashboard aggregate
  const {
    data: application,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyApplication();

  // 3. Live approval synchronization: when application reflects approved & active in polling
  useEffect(() => {
    if (
      application?.college?.approvalStatus === 'APPROVED' &&
      application?.college?.status === 'ACTIVE' &&
      !isTransitioning
    ) {
      setIsTransitioning(true);
      authService
        .getMe()
        .then((freshUser) => {
          useAuthStore.getState().setUser(freshUser);
          queryClient.invalidateQueries({
            queryKey: queryKeys.auth.currentUser(),
          });
          navigate('/college/dashboard', { replace: true });
        })
        .catch((err) => {
          setIsTransitioning(false);
          setActionError(
            isApiError(err)
              ? err.message
              : 'Failed to synchronize account authorization. Please refresh.'
          );
        });
    }
  }, [
    application?.college?.approvalStatus,
    application?.college?.status,
    isTransitioning,
    navigate,
    queryClient,
  ]);

  // 4. Mutation hooks
  const { mutate: createCorrectionDraft, isPending: isStartingCorrection } =
    useCreateCorrectionDraft();
  const { mutate: deleteDocument } = useDeleteDocument();
  const { mutate: submitApplication, isPending: isSubmittingApplication } =
    useSubmitApplication();

  const isEmailVerified = Boolean(
    user?.emailVerified ?? application?.checklist?.emailVerified ?? false
  );

  // 5. Account suspension or inactivity handling
  const isSuspendedOrInactive =
    isApiError(error) &&
    (error.errorCode === 'COLLEGE_SUSPENDED' ||
      error.errorCode === 'COLLEGE_INACTIVE');

  if (isSuspendedOrInactive && isApiError(error)) {
    return (
      <PageContainer
        title="College Onboarding Status"
        subtitle="Review the approval and verification progress of your affiliated institution."
        maxWidth="5xl"
      >
        <SuspendedCollegeCard
          status={error.errorCode}
          errorMessage={error.message}
        />
      </PageContainer>
    );
  }

  // 6. Permanent rejection handling (strictly check errorCode, avoiding generic 403 collisions)
  const isPermanentRejection =
    isApiError(error) &&
    error.errorCode === 'REGISTRATION_PERMANENTLY_REJECTED';

  if (isPermanentRejection) {
    return (
      <PageContainer
        title="College Onboarding Status"
        subtitle="Review the approval and verification progress of your affiliated institution."
        maxWidth="5xl"
      >
        <div className="bg-white border border-rose-200 rounded-xl shadow-sm p-8 text-center space-y-5 my-8">
          <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-2">
            <Ban className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Registration Application Permanently Rejected
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              This college registration application has been permanently rejected by the Super Admin team, or has exhausted all available resubmission attempts.
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-4 text-xs max-w-md mx-auto text-left space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Account Notice:</span>
            </div>
            <p>
              No further correction revisions may be created for this institution. Please reach out to Acadlytic institutional support for guidance or re-application instructions.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/auth/login')}
              className="text-xs"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 7. Transitioning display
  if (isTransitioning) {
    return (
      <PageContainer
        title="College Onboarding Status"
        subtitle="Review the approval and verification progress of your affiliated institution."
        maxWidth="5xl"
      >
        <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm p-12 text-center space-y-4 my-8">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-12 w-12 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Application Approved!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your institution registration has been officially approved. Synchronizing credentials and redirecting to your active College Dashboard...
          </p>
          <div className="pt-2 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Handlers
  const handleStartCorrection = () => {
    setActionError(null);
    createCorrectionDraft(undefined, {
      onError: (err: unknown) => {
        if (isApiError(err)) {
          setActionError(
            err.message || 'Failed to initialize correction draft.'
          );
        } else {
          setActionError('An unexpected error occurred. Please try again.');
        }
      },
    });
  };

  const handleDeleteDocument = (doc: DocumentResponse) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${doc.originalFilename}"? If this document replaced a previous version, its predecessor will be restored.`
      )
    ) {
      return;
    }

    setActionError(null);
    setDeletingDoc(doc);
    deleteDocument(doc.id, {
      onError: (err: unknown) => {
        if (isApiError(err)) {
          setActionError(err.message || 'Failed to delete document.');
        } else {
          setActionError('An unexpected error occurred. Please try again.');
        }
      },
      onSettled: () => {
        setDeletingDoc(null);
      },
    });
  };

  const handleOpenUpload = (replaceDoc?: DocumentResponse) => {
    setActionError(null);
    setReplacingDoc(replaceDoc || null);
    setIsUploadModalOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadModalOpen(false);
    setReplacingDoc(null);
  };

  const handleOpenSubmit = () => {
    setActionError(null);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    setActionError(null);
    submitApplication(undefined, {
      onSuccess: () => {
        setIsSubmitModalOpen(false);
      },
      onError: (err: unknown) => {
        if (isApiError(err)) {
          setActionError(err.message || 'Failed to submit application.');
        } else {
          setActionError('An unexpected error occurred. Please try again.');
        }
      },
    });
  };

  // Computed state when application data is available
  const currentRevision = application?.currentRevision;
  const isDraft = isDraftEditable(currentRevision);
  const isEditable = isDraft;
  const isFrozen = isApplicationFrozenInReview(
    currentRevision,
    application?.checklist
  );

  return (
    <PageContainer
      title="College Onboarding Status"
      subtitle="Review the approval and verification progress of your affiliated institution."
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Unverified Email Warning Banner */}
        {!isEmailVerified && (
          <Alert
            variant="warning"
            title="Action Required: Verify Your Email Address"
          >
            <div className="space-y-3">
              <p>
                A verification link was sent to your administrator email address ({user?.email}). You must verify your email address to unlock document upload and submit your application for Super Admin review.
              </p>
              <div className="pt-1">
                <ResendVerificationButton />
              </div>
            </div>
          </Alert>
        )}

        {/* Global Action Error Alert */}
        {actionError && (
          <Alert
            variant="error"
            title="Action Failed"
            className="text-xs"
          >
            {actionError}
          </Alert>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-500 font-medium">
              Loading institutional onboarding application...
            </p>
          </div>
        )}

        {/* Error state indicator */}
        {!isLoading && (isError || !application) && (
          <div className="my-8">
            <ErrorState
              title="Unable to Load Registration Status"
              message={
                isApiError(error)
                  ? error.message
                  : 'Failed to retrieve your institution registration details. Please try again.'
              }
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* Main application dashboard content */}
        {!isLoading && application && currentRevision && (
          <>
            {/* Status Lifecycle Header Banner */}
            <OnboardingStatusBanner
              application={application}
              onStartCorrection={handleStartCorrection}
              isStartingCorrection={isStartingCorrection}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            />

            {/* Super Admin Review Feedback */}
            <ReviewFeedbackCard
              feedback={application.reviewFeedback}
              status={currentRevision.status}
            />

            {/* Institutional Profile Summary Card */}
            <CollegeProfileCard
              profile={currentRevision.profile}
              collegeCode={application.college.code}
              isEditable={isEditable}
              onEdit={() => setIsEditProfileOpen(true)}
            />

            {/* Document Management Section */}
            <DocumentManagementSection
              documents={application.activeDocuments}
              isEditable={isEditable}
              isEmailVerified={isEmailVerified}
              onUploadClick={() => handleOpenUpload()}
              onReplaceClick={(doc) => handleOpenUpload(doc)}
              onDeleteClick={handleDeleteDocument}
              isDeletingId={deletingDoc?.id}
            />

            {/* Verification Readiness Checklist & Final Review Submission */}
            <OnboardingChecklistCard
              checklist={application.checklist}
              isEmailVerified={isEmailVerified}
              isFrozen={isFrozen}
              isDraft={isDraft}
              status={currentRevision.status}
              onEditProfile={() => setIsEditProfileOpen(true)}
              onOpenUploadModal={() => handleOpenUpload()}
              onSubmitForReview={handleOpenSubmit}
              isSubmitting={isSubmittingApplication}
            />

            {/* Edit Profile Modal */}
            {currentRevision.profile && (
              <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                profile={currentRevision.profile}
                collegeCode={application.college.code}
              />
            )}

            {/* Document Upload Modal */}
            <DocumentUploadModal
              isOpen={isUploadModalOpen}
              onClose={handleCloseUpload}
              existingReplacingDoc={replacingDoc}
            />

            {/* Submit Application Confirmation Modal */}
            <SubmitApplicationModal
              isOpen={isSubmitModalOpen}
              onClose={() => setIsSubmitModalOpen(false)}
              onSubmit={handleConfirmSubmit}
              isSubmitting={isSubmittingApplication}
              versionNumber={currentRevision.versionNumber}
              checklist={application.checklist}
            />

            {/* Revision History Drawer */}
            <RevisionHistoryDrawer
              isOpen={isHistoryDrawerOpen}
              onClose={() => setIsHistoryDrawerOpen(false)}
              revisionHistory={application.revisionHistory}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
};
