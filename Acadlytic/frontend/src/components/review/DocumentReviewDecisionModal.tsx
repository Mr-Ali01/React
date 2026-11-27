import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { XCircle, Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { useRecordDocumentDecision } from '@/hooks/useCollegeReview';
import { documentReviewDecisionSchema } from '@/schemas/reviewSchema';
import { isApiError } from '@/services/api';
import { REVIEW_DOCUMENT_CATEGORY_LABELS } from './ReviewDocumentListCard';
import type {
  DocumentResponse,
  DocumentReviewDecisionFormValues,
  DocumentReviewDecisionResponse,
} from '@/types';

interface DocumentReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: number;
  document: DocumentResponse | null;
  onDecisionSuccess?: (response: DocumentReviewDecisionResponse) => void;
  onStaleConflict?: () => void;
}

export const DocumentReviewDecisionModal: React.FC<
  DocumentReviewDecisionModalProps
> = ({
  isOpen,
  onClose,
  collegeId,
  document,
  onDecisionSuccess,
  onStaleConflict,
}) => {
  const { mutateAsync: recordDecision, isPending } =
    useRecordDocumentDecision(collegeId);
  const [serverError, setServerError] = useState<string | null>(null);

  // Authoritative document version safety: version 0 is valid!
  const hasValidVersion =
    document !== null &&
    typeof document.version === 'number' &&
    Number.isSafeInteger(document.version) &&
    document.version >= 0;

  const currentVersion = hasValidVersion ? (document.version as number) : 0;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DocumentReviewDecisionFormValues>({
    resolver: zodResolver(documentReviewDecisionSchema),
    mode: 'onTouched',
    defaultValues: {
      action: 'REJECT',
      expectedDocumentVersion: currentVersion,
      notes: '',
      rejectionReason: '',
    },
  });

  // Keep form values in sync when selected document or open state changes
  useEffect(() => {
    if (document && isOpen) {
      reset({
        action: 'REJECT',
        expectedDocumentVersion: typeof document.version === 'number' ? document.version : 0,
        notes: '',
        rejectionReason: '',
      });
      setServerError(null);
    }
  }, [document, isOpen, reset]);

  if (!document) return null;

  const rejectionVal = watch('rejectionReason') || '';
  const notesVal = watch('notes') || '';

  const onSubmit = async (values: DocumentReviewDecisionFormValues) => {
    try {
      setServerError(null);

      // Fail-closed version validation: never substitute or guess version
      if (!hasValidVersion || document.version == null) {
        setServerError(
          'Cannot submit document review decision: authoritative document version is missing or invalid.'
        );
        return;
      }

      const payload = {
        action: values.action,
        expectedDocumentVersion: document.version,
        rejectionReason: values.rejectionReason?.trim()
          ? values.rejectionReason.trim()
          : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };

      const result = await recordDecision({
        documentId: document.id,
        request: payload,
      });

      onClose();
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
          // Strict stale version handling: close modal and trigger parent conflict refresh
          onClose();
          if (onStaleConflict) {
            onStaleConflict();
          }
          return;
        }

        if (err.errorCode === 'APPLICATION_NOT_AWAITING_REVIEW') {
          setServerError(
            'This application is no longer awaiting review. Document review decisions are frozen.'
          );
          return;
        }

        setServerError(
          err.message || 'An error occurred while submitting document rejection.'
        );
        return;
      }
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  const categoryLabel =
    REVIEW_DOCUMENT_CATEGORY_LABELS[document.documentCategory] ||
    document.documentCategory;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Document — ${categoryLabel}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register('action')} />
        <input
          type="hidden"
          {...register('expectedDocumentVersion', { valueAsNumber: true })}
        />

        {!hasValidVersion && (
          <Alert variant="error" title="Document Version Unavailable">
            Authoritative document version is missing or invalid. Decisions
            cannot be recorded to protect state integrity.
          </Alert>
        )}

        {serverError && (
          <Alert variant="error" title="Submission Error">
            {serverError}
          </Alert>
        )}

        {/* Informational Guidance Callout */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-red-900 text-sm">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Document Rejection Notice</p>
            <p className="text-xs text-red-800 leading-relaxed">
              Rejecting <strong>{document.originalFilename}</strong> marks its
              verification status as <strong>REJECTED</strong>. This application
              will not be eligible for approval until this document is replaced
              via a correction revision requested from the college administrator.
            </p>
          </div>
        </div>

        {/* Concurrency Locking Version Badge */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Document Version:{' '}
              <strong>
                {hasValidVersion
                  ? `#${document.version}`
                  : 'Invalid / Unavailable'}
              </strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 truncate max-w-xs" title={document.originalFilename}>
            {document.originalFilename}
          </span>
        </div>

        {/* Rejection Reason Textarea (Required: 10-1000 characters) */}
        <div className="space-y-1">
          <Textarea
            label="Rejection Reason"
            required
            rows={4}
            placeholder="State clear, constructive reasons explaining why this verification document is rejected (minimum 10 characters)..."
            error={errors.rejectionReason?.message}
            {...register('rejectionReason')}
          />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>Minimum 10 characters</span>
            <span>{rejectionVal.length}/1000</span>
          </div>
        </div>

        {/* Review Notes Textarea (Optional: max 1000 characters) */}
        <div className="space-y-1">
          <Textarea
            label="Internal Review Notes (Optional)"
            rows={3}
            placeholder="Optional internal review notes recorded in audit history..."
            error={errors.notes?.message}
            {...register('notes')}
          />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>Optional internal notes</span>
            <span>{notesVal.length}/1000</span>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="danger"
            disabled={isPending || !hasValidVersion}
            className="flex items-center gap-1.5 text-sm"
          >
            <XCircle className="h-4 w-4" />
            {isPending ? 'Rejecting Document...' : 'Confirm Document Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
