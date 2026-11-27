import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  REVIEW_DOCUMENT_CATEGORY_LABELS,
  formatBytes,
} from './ReviewDocumentListCard';
import {
  useRecordDocumentDecision,
  useDocumentReviewHistory,
} from '@/hooks/useCollegeReview';
import { reviewService } from '@/services/reviewService';
import { isApiError } from '@/services/api';
import type {
  CollegeApprovalStatus,
  DocumentResponse,
  DocumentReviewDecisionResponse,
  DocumentVerificationStatus,
} from '@/types';

interface DocumentPreviewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: number;
  document: DocumentResponse | null;
  collegeApprovalStatus?: CollegeApprovalStatus;
  onDecisionSuccess?: (response: DocumentReviewDecisionResponse) => void;
  onStaleConflict?: () => void;
}

export const DocumentPreviewReviewModal: React.FC<
  DocumentPreviewReviewModalProps
> = ({
  isOpen,
  onClose,
  collegeId,
  document,
  collegeApprovalStatus = 'PENDING',
  onDecisionSuccess,
  onStaleConflict,
}) => {
  const isCollegeIdValid = typeof collegeId === 'number' && collegeId > 0;
  const isDocValid = document !== null;

  // Authoritative document version safety: version 0 is strictly valid!
  const hasValidVersion =
    document !== null &&
    typeof document.version === 'number' &&
    Number.isSafeInteger(document.version) &&
    document.version >= 0;

  const isLifecycleFrozen = collegeApprovalStatus !== 'PENDING';

  // Preview state
  const [previewState, setPreviewState] = useState<
    'idle' | 'loading' | 'success' | 'unsupported' | 'error'
  >('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string | null>(
    null
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Tab & Subview state: 'preview' | 'history'
  const [activeTab, setActiveTab] = useState<'preview' | 'history'>('preview');

  // Decision UI state
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionValidation, setRejectionValidation] = useState<string | null>(
    null
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local document state tracking after decision confirmation
  const [localStatus, setLocalStatus] =
    useState<DocumentVerificationStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { mutateAsync: recordDecision, isPending: isSubmittingDecision } =
    useRecordDocumentDecision(isCollegeIdValid ? collegeId : 0);

  // History query (enabled only when tab is active and doc exists)
  const {
    data: historyItems = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useDocumentReviewHistory(
    isCollegeIdValid ? collegeId : 0,
    document?.id ?? 0,
    isOpen && isDocValid && activeTab === 'history'
  );

  // Preview Blob retrieval and lifecycle management
  useEffect(() => {
    // Revoke previous blob URL if exists
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!isOpen || !document || !isCollegeIdValid) {
      setPreviewState('idle');
      setPreviewUrl(null);
      setPreviewContentType(null);
      setPreviewError(null);
      setIsRejectMode(false);
      setRejectionReason('');
      setNotes('');
      setRejectionValidation(null);
      setServerError(null);
      setSuccessMessage(null);
      setLocalStatus(null);
      setActiveTab('preview');
      return;
    }

    setLocalStatus(document.verificationStatus ?? null);
    setPreviewState('loading');
    setPreviewError(null);
    setServerError(null);
    setSuccessMessage(null);

    let isCancelled = false;

    reviewService
      .getDocumentPreviewBlob(collegeId, document.id)
      .then(({ blob, contentType }) => {
        if (isCancelled) return;
        const objectUrl = window.URL.createObjectURL(blob);
        previewUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
        setPreviewContentType(contentType);

        const isPdf =
          contentType.includes('pdf') ||
          document.mimeType?.includes('pdf') ||
          document.originalFilename.toLowerCase().endsWith('.pdf');
        const isImage =
          contentType.startsWith('image/') ||
          document.mimeType?.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.originalFilename);

        if (isPdf || isImage) {
          setPreviewState('success');
        } else {
          setPreviewState('unsupported');
        }
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        setPreviewState('error');
        setPreviewError(
          isApiError(err)
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Unable to load document preview stream from server.'
        );
      });

    return () => {
      isCancelled = true;
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [isOpen, document?.id, collegeId]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  if (!isOpen || !document) return null;

  const currentStatus = localStatus || document.verificationStatus;
  const isDocAccepted = currentStatus === 'ACCEPTED';
  const isDocRejected = currentStatus === 'REJECTED';
  const categoryLabel =
    REVIEW_DOCUMENT_CATEGORY_LABELS[document.documentCategory] ||
    document.documentCategory;

  const isPdf =
    previewContentType?.includes('pdf') ||
    document.mimeType?.includes('pdf') ||
    document.originalFilename.toLowerCase().endsWith('.pdf');
  const isImage =
    previewContentType?.startsWith('image/') ||
    document.mimeType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.originalFilename);

  const handleDownload = async () => {
    if (!isCollegeIdValid) return;
    try {
      setIsDownloading(true);
      setDownloadError(null);
      await reviewService.downloadReviewDocument(
        collegeId,
        document.id,
        document.originalFilename
      );
    } catch {
      setDownloadError(
        `Failed to download ${document.originalFilename}. Please try again.`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAccept = async () => {
    if (!isCollegeIdValid || !hasValidVersion || document.version == null) {
      setServerError(
        'Cannot accept document: authoritative document version is missing or invalid.'
      );
      return;
    }

    try {
      setServerError(null);
      setSuccessMessage(null);

      const result = await recordDecision({
        documentId: document.id,
        request: {
          action: 'ACCEPT',
          expectedDocumentVersion: document.version,
        },
      });

      setLocalStatus('ACCEPTED');
      setSuccessMessage(
        `Document "${document.originalFilename}" accepted successfully.`
      );
      if (onDecisionSuccess) {
        onDecisionSuccess(result);
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (
          err.errorCode === 'STALE_DOCUMENT_VERSION' ||
          (err.status === 409 &&
            err.errorCode !== 'APPLICATION_NOT_AWAITING_REVIEW')
        ) {
          onClose();
          if (onStaleConflict) onStaleConflict();
          return;
        }

        if (err.errorCode === 'APPLICATION_NOT_AWAITING_REVIEW') {
          setServerError(
            'Document reviews are frozen because this college is no longer awaiting review.'
          );
          return;
        }

        setServerError(
          err.message || `Failed to accept ${document.originalFilename}.`
        );
        return;
      }
      setServerError('An unexpected error occurred while accepting document.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCollegeIdValid || !hasValidVersion || document.version == null) {
      setServerError(
        'Cannot reject document: authoritative document version is missing or invalid.'
      );
      return;
    }

    const trimmedReason = rejectionReason.trim();
    if (trimmedReason.length < 10) {
      setRejectionValidation(
        'Rejection reason must be at least 10 characters explaining what corrections are required.'
      );
      return;
    }
    if (trimmedReason.length > 2000) {
      setRejectionValidation(
        'Rejection reason must not exceed 2000 characters.'
      );
      return;
    }

    try {
      setRejectionValidation(null);
      setServerError(null);
      setSuccessMessage(null);

      const result = await recordDecision({
        documentId: document.id,
        request: {
          action: 'REJECT',
          expectedDocumentVersion: document.version,
          rejectionReason: trimmedReason,
          notes: notes.trim() ? notes.trim() : null,
        },
      });

      setLocalStatus('REJECTED');
      setIsRejectMode(false);
      setSuccessMessage(
        `Document "${document.originalFilename}" was rejected. The institution will be informed during action requests.`
      );
      if (onDecisionSuccess) {
        onDecisionSuccess(result);
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (
          err.errorCode === 'STALE_DOCUMENT_VERSION' ||
          (err.status === 409 &&
            err.errorCode !== 'APPLICATION_NOT_AWAITING_REVIEW')
        ) {
          onClose();
          if (onStaleConflict) onStaleConflict();
          return;
        }

        if (err.errorCode === 'APPLICATION_NOT_AWAITING_REVIEW') {
          setServerError(
            'Document reviews are frozen because this college is no longer awaiting review.'
          );
          return;
        }

        setServerError(
          err.message || `Failed to reject ${document.originalFilename}.`
        );
        return;
      }
      setServerError('An unexpected error occurred while rejecting document.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="max-w-5xl"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                {categoryLabel}
              </span>
              <DocumentStatusBadge status={currentStatus} />
              {hasValidVersion ? (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Version #{document.version}
                </span>
              ) : (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  Version Invalid
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-xl" title={document.originalFilename}>
              {document.originalFilename}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1 text-xs h-8"
              title="Download file to local storage"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        <div className="pt-2">
          {successMessage && (
            <div className="mb-2">
              <Alert
                variant="success"
                title="Decision Recorded"
                onClose={() => setSuccessMessage(null)}
              >
                {successMessage}
              </Alert>
            </div>
          )}

          {serverError && (
            <div className="mb-2">
              <Alert
                variant="error"
                title="Review Action Error"
                onClose={() => setServerError(null)}
              >
                {serverError}
              </Alert>
            </div>
          )}

          {downloadError && (
            <div className="mb-2">
              <Alert
                variant="error"
                title="Download Error"
                onClose={() => setDownloadError(null)}
              >
                {downloadError}
              </Alert>
            </div>
          )}

          {isLifecycleFrozen && (
            <div className="mb-2">
              <Alert variant="warning" title="Decisions Frozen">
                Review decisions are disabled because this institution application is {collegeApprovalStatus}.
              </Alert>
            </div>
          )}
        </div>

        {/* Modal Body: Active Tab Content */}
        <div className="flex-1 overflow-y-auto py-2 min-h-[360px]">
          {activeTab === 'preview' ? (
            <div className="flex flex-col h-full space-y-3">
              {/* Document Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">File Size:</span>
                  <span className="font-medium text-slate-800">
                    {formatBytes(document.fileSizeBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">MIME Type:</span>
                  <span className="font-mono text-slate-800 truncate block">
                    {previewContentType || document.mimeType || 'unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Document Version:</span>
                  <span className="font-medium text-slate-800">
                    {hasValidVersion ? `#${document.version}` : 'Invalid'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">SHA-256 Checksum:</span>
                  {document.sha256Checksum ? (
                    <code
                      className="font-mono text-[10px] text-slate-700 truncate block bg-slate-100 p-0.5 rounded cursor-help"
                      title={document.sha256Checksum}
                    >
                      {document.sha256Checksum.slice(0, 10)}...{document.sha256Checksum.slice(-8)}
                    </code>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </div>
              </div>

              {/* Main Document Viewer */}
              <div className="flex-1 min-h-[380px] bg-slate-900 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center relative">
                {previewState === 'loading' && (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-white">
                    <LoadingSpinner size="lg" />
                    <p className="text-xs text-slate-300 font-medium">
                      Loading document preview stream...
                    </p>
                  </div>
                )}

                {previewState === 'error' && (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center bg-slate-50 w-full h-full">
                    <XCircle className="h-10 w-10 text-rose-500" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Preview Unavailable
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md">
                        {previewError || 'Failed to stream the document binary from storage.'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="text-xs mt-2"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download Document File Instead
                    </Button>
                  </div>
                )}

                {previewState === 'unsupported' && (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center bg-slate-50 w-full h-full">
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Format Not Renderable Inline
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md">
                        This file format ({previewContentType || document.mimeType}) cannot be directly rendered inside the browser viewport. You can safely download and review it locally.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownload}
                      className="text-xs mt-2"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download to View
                    </Button>
                  </div>
                )}

                {previewState === 'success' && previewUrl && (
                  <>
                    {isPdf ? (
                      <iframe
                        src={previewUrl}
                        title={`Preview of ${document.originalFilename}`}
                        className="w-full h-full min-h-[440px] border-none bg-white"
                      />
                    ) : isImage ? (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950 overflow-auto">
                        <img
                          src={previewUrl}
                          alt={`Document ${document.originalFilename}`}
                          className="max-h-[440px] max-w-full object-contain rounded shadow"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* In-Line Rejection Drawer */}
              {isRejectMode && (
                <form
                  onSubmit={handleRejectSubmit}
                  className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      Document Rejection Reason (Required)
                    </h4>
                    <span className="text-[11px] text-rose-700">
                      {rejectionReason.length} / 2000 characters
                    </span>
                  </div>

                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (rejectionValidation) setRejectionValidation(null);
                    }}
                    placeholder="Describe specific compliance issues (e.g., 'Certificate expired on 2025-12-31; please upload current renewal certificate signed by University Registrar'). Minimum 10 characters."
                    rows={3}
                    className="text-xs"
                    disabled={isSubmittingDecision}
                  />

                  {rejectionValidation && (
                    <p className="text-xs text-rose-700 font-medium">
                      {rejectionValidation}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsRejectMode(false);
                        setRejectionValidation(null);
                      }}
                      disabled={isSubmittingDecision}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      onClick={handleRejectSubmit}
                      disabled={
                        isSubmittingDecision ||
                        isLifecycleFrozen ||
                        !hasValidVersion
                      }
                      className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {isSubmittingDecision ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Document Review Decision History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Decision Audit Trail
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                  disabled={isLoadingHistory}
                  className="text-xs h-7"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-slate-500">Loading audit history...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No previous review decision entries recorded for this document.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                            entry.action === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {entry.action === 'ACCEPTED' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-rose-600" />
                          )}
                          {entry.action}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {entry.reviewedAt
                            ? new Date(entry.reviewedAt).toLocaleString()
                            : 'Date unavailable'}
                        </span>
                      </div>

                      {entry.reviewerEmail && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">Reviewer: </span>
                          <span className="font-medium text-slate-800">
                            {entry.reviewerEmail}
                          </span>
                        </div>
                      )}

                      {entry.rejectionReason && (
                        <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-800 mt-1">
                          <span className="font-semibold block text-[10px] uppercase tracking-wider text-rose-600 mb-0.5">
                            Rejection Reason:
                          </span>
                          <p className="whitespace-pre-wrap">{entry.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Review Decision Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {/* Reject Document Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('preview');
                setIsRejectMode(true);
              }}
              disabled={
                isLifecycleFrozen ||
                !hasValidVersion ||
                isSubmittingDecision ||
                isRejectMode
              }
              aria-label={`Reject ${document.originalFilename}`}
              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 h-8 ${
                isDocRejected
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'text-rose-700 border-rose-300 hover:bg-rose-50'
              }`}
              title={
                isLifecycleFrozen
                  ? `Decisions are frozen (${collegeApprovalStatus})`
                  : !hasValidVersion
                  ? 'Decisions locked: invalid document version'
                  : 'Reject document'
              }
            >
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              {isDocRejected ? 'Rejected' : 'Reject'}
            </Button>

            {/* Accept Document Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAccept}
              disabled={
                isLifecycleFrozen ||
                !hasValidVersion ||
                isSubmittingDecision ||
                isDocAccepted
              }
              aria-label={`Accept ${document.originalFilename}`}
              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 h-8 ${
                isDocAccepted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                  : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
              title={
                isLifecycleFrozen
                  ? `Decisions are frozen (${collegeApprovalStatus})`
                  : !hasValidVersion
                  ? 'Decisions locked: invalid document version'
                  : isDocAccepted
                  ? 'Document is already accepted'
                  : 'Accept document'
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {isSubmittingDecision
                ? 'Accepting...'
                : isDocAccepted
                ? 'Accepted'
                : 'Accept'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
