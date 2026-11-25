import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { CollegeReviewSummaryResponse, ReviewDecisionAction } from '@/types';

interface ReviewDecisionPanelProps {
  college: CollegeReviewSummaryResponse;
  onOpenModal: (action: ReviewDecisionAction) => void;
  disabled?: boolean;
}

export const ReviewDecisionPanel: React.FC<ReviewDecisionPanelProps> = ({
  college,
  onOpenModal,
  disabled = false,
}) => {
  const isPending = college.approvalStatus === 'PENDING';
  const isActionCeilingReached = college.actionRequiredCount >= 10;
  const isFinalRevision = college.resubmissionCount >= 3;

  return (
    <Card className="p-6 bg-slate-50 border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Super Admin Review Decision
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Decisions are recorded authoritatively with optimistic version locking (Version #{college.concurrencyVersion}).
          </p>
        </div>

        {!isPending ? (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Application is {college.approvalStatus}. Review decisions can only be made on PENDING applications.
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
              disabled={disabled}
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
              disabled={disabled || isActionCeilingReached}
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
              disabled={disabled}
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
