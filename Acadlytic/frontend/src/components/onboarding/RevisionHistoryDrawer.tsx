import React from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CollegeApprovalStatus, RevisionSummaryResponse } from '@/types';

interface RevisionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  revisionHistory: RevisionSummaryResponse[];
}

export const RevisionHistoryDrawer: React.FC<RevisionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  revisionHistory,
}) => {
  const getStatusBadge = (status: CollegeApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="h-3 w-3 text-sky-600" />
            Pending
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            Action Required
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Revision History"
      description="Historical record of all submitted application revisions and Super Admin review outcomes."
      size="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {revisionHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No previous submitted revisions found.
          </div>
        ) : (
          <div className="space-y-4">
            {revisionHistory.map((rev) => {
              const submittedDate = rev.submittedForReviewAt
                ? new Date(rev.submittedForReviewAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Not submitted';
              const reviewedDate = rev.reviewedAt
                ? new Date(rev.reviewedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : null;

              return (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Revision v{rev.versionNumber}
                      </span>
                      {getStatusBadge(rev.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Submitted: {submittedDate}</span>
                    </div>
                  </div>

                  {reviewedDate && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-500">
                      <span>Reviewed: {reviewedDate}</span>
                      {rev.isPermanentRejection && (
                        <span className="text-rose-600 font-semibold">
                          Permanent Rejection
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
