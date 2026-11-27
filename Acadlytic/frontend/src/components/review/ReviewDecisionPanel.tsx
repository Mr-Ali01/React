import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  assessDocumentReadiness,
  REVIEW_DOCUMENT_CATEGORY_LABELS,
} from './ReviewDocumentListCard';
import type {
  CollegeReviewSummaryResponse,
  DocumentResponse,
  ReviewDecisionAction,
} from '@/types';

interface ReviewDecisionPanelProps {
  college: CollegeReviewSummaryResponse;
  documents?: DocumentResponse[];
  onOpenModal: (action: ReviewDecisionAction) => void;
  disabled?: boolean;
}

export const ReviewDecisionPanel: React.FC<ReviewDecisionPanelProps> = ({
  college,
  documents,
  onOpenModal,
  disabled = false,
}) => {
  const isPending = college.approvalStatus === 'PENDING';
  const isActionCeilingReached = college.actionRequiredCount >= 10;
  const isFinalRevision = college.resubmissionCount >= 3;
  const hasValidVersion =
    typeof college.concurrencyVersion === 'number' &&
    Number.isSafeInteger(college.concurrencyVersion) &&
    college.concurrencyVersion >= 0;

  const hasDocumentsProp = documents !== undefined;
  const readiness = hasDocumentsProp ? assessDocumentReadiness(documents) : null;
  const isBlockedByReadiness =
    readiness !== null && !readiness.isReadyForApproval;

  return (
    <Card className="p-6 bg-slate-50 border-slate-200">
      {/* Proactive Document Readiness Callout for PENDING Applications */}
      {isPending && readiness && (
        <div className="mb-4">
          {readiness.hasInvalidDocumentData ? (
            <Alert variant="error" title="Data Integrity Warning">
              One or more documents contain invalid or unrecognized verification
              data. College approval is blocked.
            </Alert>
          ) : readiness.missingMandatoryCategories.length > 0 ? (
            <Alert variant="warning" title="Mandatory Documents Missing">
              Missing required document(s):{' '}
              {readiness.missingMandatoryCategories
                .map((cat) => REVIEW_DOCUMENT_CATEGORY_LABELS[cat] || cat)
                .join(', ')}
              . College approval is blocked until all mandatory documents are
              provided.
            </Alert>
          ) : readiness.hasRejectedDocuments ? (
            <Alert variant="error" title="Documents Rejected">
              {readiness.rejectedCount} document(s) have been rejected. You must
              request corrections from the college administrator before this
              application can be approved.
            </Alert>
          ) : readiness.hasPendingDocuments ? (
            <Alert variant="info" title="Documents Pending Review">
              {readiness.pendingCount} document(s) are pending verification. All
              active documents must be accepted prior to college approval.
            </Alert>
          ) : readiness.isReadyForApproval ? (
            <Alert variant="success" title="Ready for Institutional Approval">
              All {readiness.acceptedCount} required documents have been
              reviewed and accepted. This application is eligible for
              approval.
            </Alert>
          ) : null}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Super Admin Review Decision
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Decisions are recorded authoritatively with optimistic version
            locking (
            {hasValidVersion
              ? `Version #${college.concurrencyVersion}`
              : 'Version unavailable'}
            ).
          </p>
        </div>

        {!isPending ? (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Application is {college.approvalStatus}. Review decisions can only
              be made on PENDING applications.
            </span>
          </div>
        ) : !hasValidVersion ? (
          <div className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Authoritative concurrency version is unavailable. Review decisions
              are locked to prevent state corruption.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {/* APPROVE BUTTON */}
            <Button
              type="button"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-sm"
              onClick={() => onOpenModal('APPROVE')}
              disabled={
                disabled || !hasValidVersion || isBlockedByReadiness
              }
              title={
                isBlockedByReadiness && readiness
                  ? readiness.blockers.join(' ')
                  : 'Approve this college registration'
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>

            {/* REQUEST ACTION BUTTON */}
            <Button
              type="button"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 text-sm"
              onClick={() => onOpenModal('REQUEST_ACTION')}
              disabled={disabled || isActionCeilingReached || !hasValidVersion}
              title={
                isActionCeilingReached
                  ? 'Action request ceiling reached (10 max)'
                  : 'Request corrections from College Admin'
              }
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Request Action
            </Button>

            {/* REJECT BUTTON */}
            <Button
              type="button"
              variant="danger"
              className="flex items-center gap-1.5 text-sm"
              onClick={() => onOpenModal('REJECT')}
              disabled={disabled || !hasValidVersion}
            >
              <XCircle className="h-4 w-4" />
              {isFinalRevision ? 'Reject (Permanent)' : 'Reject'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
