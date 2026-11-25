import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    setSuccessMessage(
      response.message || `Decision ${response.action} recorded successfully.`
    );
    setStaleConflict(false);
    refetch();
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
          onOpenModal={handleOpenDecisionModal}
        />

        {/* 2-Column Institutional & Administrator Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CollegeProfileReviewCard profile={currentRevision} />
          <ReviewAdminUserCard adminUser={adminUser} />
        </div>

        {/* Verification Documents Section */}
        <ReviewDocumentListCard
          collegeId={college.collegeId}
          documents={activeDocuments}
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
