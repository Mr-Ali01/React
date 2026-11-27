import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  CollegeReviewHeader,
  ReviewAdminUserCard,
  CollegeProfileReviewCard,
  ReviewDocumentListCard,
  RevisionHistoryTimelineCard,
  ReviewDecisionPanel,
  ReviewDecisionModal,
} from '@/components/review';
import { useReviewDetail } from '@/hooks/useCollegeReview';
import type { ReviewDecisionAction, ReviewDecisionResponse } from '@/types';

export const CollegeReviewDetailPage: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const navigate = useNavigate();

  const id = Number(collegeId);
  const isValidId = !isNaN(id) && id > 0;

  const { data, isLoading, error, refetch } = useReviewDetail(isValidId ? id : 0);

  // Modal & Action states
  const [activeAction, setActiveAction] = useState<ReviewDecisionAction | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stale Conflict & Success feedback states
  const [staleConflict, setStaleConflict] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [decisionCompleted, setDecisionCompleted] = useState<{
    action: ReviewDecisionAction;
    message: string;
    collegeName: string;
  } | null>(null);

  const handleBackToQueue = () => {
    navigate('/admin/colleges/reviews');
  };

  const handleOpenDecisionModal = (action: ReviewDecisionAction) => {
    setActiveAction(action);
    setIsModalOpen(true);
  };

  const handleCloseDecisionModal = () => {
    setIsModalOpen(false);
    setActiveAction(null);
  };

  const handleDecisionSuccess = (response: ReviewDecisionResponse) => {
    const resolvedAction: ReviewDecisionAction =
      response.action || activeAction || 'APPROVE';
    setIsModalOpen(false);
    setActiveAction(null);
    setStaleConflict(false);
    setSuccessMessage(
      response.message || `Decision ${resolvedAction} recorded successfully.`
    );
    setDecisionCompleted({
      action: resolvedAction,
      message:
        response.message ||
        `Review decision ${resolvedAction} recorded successfully.`,
      collegeName: data?.college?.legalName || 'College Application',
    });
    // Do NOT call refetch() - the application is no longer awaiting review!
  };

  const handleStaleConflict = () => {
    setStaleConflict(true);
    refetch(); // Automatically refetch latest detail from server
  };

  if (!isValidId) {
    return (
      <PageContainer title="Invalid Review Request">
        <Alert variant="error" title="Invalid College ID">
          The requested college review identifier is malformed.
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBackToQueue}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Review Queue
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Authoritative decision success confirmation view (prevents post-decision 409 refetch)
  if (decisionCompleted) {
    const isApproval = decisionCompleted.action === 'APPROVE';
    const isActionReq = decisionCompleted.action === 'REQUEST_ACTION';

    return (
      <PageContainer title="Review Decision Completed" maxWidth="5xl">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center space-y-6 my-6">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isApproval
                ? 'College Registration Application Approved!'
                : isActionReq
                ? 'Corrections Requested Successfully'
                : 'College Application Rejected'}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {decisionCompleted.message}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Institution:</span>
              <span className="font-semibold text-slate-800">
                {decisionCompleted.collegeName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Decision Recorded:</span>
              <span className="font-semibold text-slate-800">
                {decisionCompleted.action}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Review Queue Status:</span>
              <span className="font-semibold text-emerald-700">
                Removed from Pending Review Queue
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={handleBackToQueue}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Review Queue
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Application Review...">
        <div className="flex flex-col items-center justify-center p-16">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Fetching institutional review dossier...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="Application Review Error">
        <Alert variant="error" title="Failed to Load College Application">
          The application details could not be retrieved. The college may not exist or is no longer awaiting review.
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBackToQueue}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Review Queue
          </Button>
        </div>
      </PageContainer>
    );
  }

  const { college, adminUser, activeDocuments, currentRevision, reviewHistory } =
    data;

  return (
    <PageContainer maxWidth="7xl">
      {/* College Header */}
      <CollegeReviewHeader college={college} onBack={handleBackToQueue} />

      {/* Stale Version Concurrency Alert */}
      {staleConflict && (
        <div className="mb-6">
          <Alert
            variant="warning"
            title="Application Details Updated by Concurrent Process"
            onClose={() => setStaleConflict(false)}
          >
            The application details or review version were updated while you were
            inspecting this dossier. The latest data has been refreshed below.
            Please review the updated information carefully before initiating a new
            decision.
          </Alert>
        </div>
      )}

      {/* Decision Success Notification */}
      {successMessage && (
        <div className="mb-6">
          <Alert
            variant="success"
            title="Review Decision Recorded"
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Main Review Layout */}
      <div className="space-y-6">
        {/* Decision Action Toolbar */}
        <ReviewDecisionPanel
          college={college}
          documents={activeDocuments}
          onOpenModal={handleOpenDecisionModal}
        />

        {/* 2-Column Institutional & Administrator Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CollegeProfileReviewCard profile={currentRevision} />
          <ReviewAdminUserCard adminUser={adminUser} />
        </div>

        {/* Verification Documents Section */}
        <ReviewDocumentListCard
          collegeId={college.id ?? college.collegeId}
          documents={activeDocuments}
          collegeApprovalStatus={college.approvalStatus}
          onRefresh={refetch}
        />

        {/* Audit & Decision Timeline History */}
        <RevisionHistoryTimelineCard reviewHistory={reviewHistory} />
      </div>

      {/* Decision Workflow Modal */}
      <ReviewDecisionModal
        isOpen={isModalOpen}
        onClose={handleCloseDecisionModal}
        action={activeAction}
        college={college}
        onDecisionSuccess={handleDecisionSuccess}
        onStaleConflict={handleStaleConflict}
      />
    </PageContainer>
  );
};
