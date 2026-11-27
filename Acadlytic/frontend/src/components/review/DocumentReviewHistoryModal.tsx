import React from 'react';
import { History, CheckCircle2, XCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useDocumentReviewHistory } from '@/hooks/useCollegeReview';
import { REVIEW_DOCUMENT_CATEGORY_LABELS } from './ReviewDocumentListCard';
import type { DocumentResponse, DocumentReviewHistoryItemResponse } from '@/types';

interface DocumentReviewHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: number;
  document: DocumentResponse | null;
}

export const DocumentReviewHistoryModal: React.FC<DocumentReviewHistoryModalProps> = ({
  isOpen,
  onClose,
  collegeId,
  document,
}) => {
  const documentId = document?.id ?? 0;
  const isEnabled = isOpen && Boolean(document && collegeId > 0 && documentId > 0);

  const { data: history = [], isLoading, error } = useDocumentReviewHistory(
    collegeId,
    documentId,
    isEnabled
  );

  if (!document) return null;

  const categoryLabel =
    REVIEW_DOCUMENT_CATEGORY_LABELS[document.documentCategory] ||
    document.documentCategory;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Document Review History — ${categoryLabel}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Document Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-sky-600" />
            <span className="font-semibold text-slate-800">
              Audit Trail & Decision Timeline
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-700 font-medium truncate max-w-xs" title={document.originalFilename}>
              {document.originalFilename}
            </span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
              Version #{document.version ?? 0}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error" title="Failed to Load History">
            Unable to retrieve the audit trail for this document. Please try again.
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-500 font-medium">
              Loading document review history...
            </p>
          </div>
        )}

        {/* Empty History State */}
        {!isLoading && !error && history.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No Review History Recorded</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This document has not undergone any formal verification decisions yet.
            </p>
          </div>
        )}

        {/* History Timeline List */}
        {!isLoading && !error && history.length > 0 && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {history.map((item: DocumentReviewHistoryItemResponse, index: number) => {
              const isAccepted = item.action === 'ACCEPTED';
              return (
                <div
                  key={item.id ?? index}
                  className={`p-3.5 rounded-lg border text-xs transition-colors ${
                    isAccepted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        isAccepted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      )}
                      {item.action}
                    </span>

                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.reviewedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 mb-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Reviewed by:{' '}
                      <strong className="text-slate-800 font-medium">
                        {item.reviewerEmail ||
                          (item.reviewerUserId
                            ? `User #${item.reviewerUserId}`
                            : 'Super Admin Reviewer')}
                      </strong>
                    </span>
                  </div>

                  {item.rejectionReason && (
                    <div className="mt-2 p-2.5 bg-white border border-rose-200 rounded text-rose-900">
                      <p className="font-semibold text-[11px] uppercase tracking-wider text-rose-700 mb-0.5">
                        Rejection Reason:
                      </p>
                      <p className="whitespace-pre-wrap text-xs text-rose-800">
                        {item.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
