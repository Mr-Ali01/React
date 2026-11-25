import React from 'react';
import { AlertTriangle, Clock, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { CollegeApprovalStatus, ReviewFeedbackResponse } from '@/types';

interface ReviewFeedbackCardProps {
  feedback?: ReviewFeedbackResponse | null;
  status: CollegeApprovalStatus;
}

export const ReviewFeedbackCard: React.FC<ReviewFeedbackCardProps> = ({
  feedback,
  status,
}) => {
  // Do not display if no feedback is provided
  if (!feedback && status !== 'ACTION_REQUIRED' && status !== 'REJECTED') {
    return null;
  }

  const isRejected = status === 'REJECTED';
  const reviewNotes = feedback?.reviewNotes;
  const rejectionReason = feedback?.rejectionReason;
  const reviewedAt = feedback?.reviewedAt;

  const formattedDate = reviewedAt
    ? new Date(reviewedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm space-y-3 ${
        isRejected
          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
          : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}
      role="region"
      aria-label="Super Admin Review Feedback"
    >
      <div className="flex items-center gap-2.5">
        {isRejected ? (
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        )}
        <h3 className="font-semibold text-base">
          {isRejected
            ? 'Super Admin Review Decision: Rejected'
            : 'Super Admin Feedback: Action Required'}
        </h3>
      </div>

      {rejectionReason && (
        <div className="space-y-1">
          <p className="text-xs uppercase font-bold tracking-wider opacity-75">
            Primary Reason:
          </p>
          <p className="text-sm font-medium leading-relaxed bg-white/60 p-3 rounded-lg border border-rose-200/60">
            {rejectionReason}
          </p>
        </div>
      )}

      {reviewNotes && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider opacity-75">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            <span>Reviewer Notes & Action Items:</span>
          </div>
          <p className="text-sm leading-relaxed bg-white/70 p-3.5 rounded-lg border border-amber-200/60 whitespace-pre-line text-slate-800">
            {reviewNotes}
          </p>
        </div>
      )}

      {formattedDate && (
        <div className="flex items-center gap-2 pt-1 text-xs opacity-75 border-t border-slate-200/50">
          <Clock className="h-3.5 w-3.5" />
          <span>Reviewed on {formattedDate}</span>
        </div>
      )}
    </div>
  );
};
