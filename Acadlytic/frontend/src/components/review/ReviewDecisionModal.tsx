import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { useRecordDecision } from '@/hooks/useCollegeReview';
import { reviewDecisionSchema } from '@/schemas/reviewSchema';
import { isApiError } from '@/services/api';
import type {
  CollegeReviewSummaryResponse,
  ReviewDecisionAction,
  ReviewDecisionFormValues,
  ReviewDecisionResponse,
} from '@/types';

interface ReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ReviewDecisionAction | null;
  college: CollegeReviewSummaryResponse;
  onDecisionSuccess: (response: ReviewDecisionResponse) => void;
  onStaleConflict: () => void;
}

export const ReviewDecisionModal: React.FC<ReviewDecisionModalProps> = ({
  isOpen,
  onClose,
  action,
  college,
  onDecisionSuccess,
  onStaleConflict,
}) => {
  const { mutateAsync: recordDecision, isPending } = useRecordDecision(
    college.collegeId
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReviewDecisionFormValues>({
    resolver: zodResolver(reviewDecisionSchema),
    mode: 'onTouched',
    defaultValues: {
      action: action || 'APPROVE',
      expectedVersion: college.concurrencyVersion,
      notes: '',
      rejectionReason: '',
    },
  });

  // Keep form in sync when action or college updates
  useEffect(() => {
    if (action && isOpen) {
      reset({
        action,
        expectedVersion: college.concurrencyVersion,
        notes: '',
        rejectionReason: '',
      });
      setServerError(null);
    }
  }, [action, isOpen, college.concurrencyVersion, reset]);

  if (!action) return null;

  const notesVal = watch('notes') || '';
  const rejectionVal = watch('rejectionReason') || '';
  const isFinalRevision = college.resubmissionCount >= 3;

  const getModalTitle = () => {
    switch (action) {
      case 'APPROVE':
        return `Approve College Registration — ${college.legalName}`;
      case 'REQUEST_ACTION':
        return `Request Action / Corrections — ${college.legalName}`;
      case 'REJECT':
        return isFinalRevision
          ? `Reject Application (Permanent) — ${college.legalName}`
          : `Reject College Application — ${college.legalName}`;
    }
  };

  const onSubmit = async (values: ReviewDecisionFormValues) => {
    try {
      setServerError(null);
      const payload = {
        action: values.action,
        notes: values.notes?.trim() ? values.notes.trim() : null,
        rejectionReason: values.rejectionReason?.trim()
          ? values.rejectionReason.trim()
          : null,
        expectedVersion: college.concurrencyVersion,
      };

      const result = await recordDecision(payload);
      onClose();
      onDecisionSuccess(result);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (
          err.errorCode === 'STALE_APPLICATION_VERSION' ||
          (err.status === 409 &&
            err.errorCode !== 'APPLICATION_NOT_AWAITING_REVIEW')
        ) {
          // Strict stale version handling: abort decision, close modal, notify reviewer
          onClose();
          onStaleConflict();
          return;
        }

        if (err.errorCode === 'APPLICATION_NOT_AWAITING_REVIEW') {
          setServerError(
            'This application is no longer awaiting review. Please return to the review queue.'
          );
          return;
        }

        setServerError(
          err.message || 'An error occurred while submitting review decision.'
        );
        return;
      }
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <Alert variant="error" title="Submission Error">
            {serverError}
          </Alert>
        )}

        {/* Action Specific Guidance Callout */}
        {action === 'APPROVE' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3 text-emerald-900 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Approval Confirmation</p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Approving this application marks the college status as{' '}
                <strong>APPROVED</strong>. Operational activation, outbox
                welcome emails, and downstream onboarding events are initiated
                by the backend lifecycle service.
              </p>
            </div>
          </div>
        )}

        {action === 'REQUEST_ACTION' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Request Corrections</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Defers approval and returns this application to the college
                administrator with status <strong>ACTION_REQUIRED</strong>. A new
                draft revision (v{(college.versionNumber ?? 1) + 1}) will be unlocked.
                This consumes action cycle {college.actionRequiredCount + 1} of 10.
              </p>
            </div>
          </div>
        )}

        {action === 'REJECT' && (
          <div
            className={
              isFinalRevision
                ? 'bg-red-50 border border-red-300 rounded-lg p-3.5 flex items-start gap-3 text-red-900 text-sm'
                : 'bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-sm'
            }
          >
            {isFinalRevision ? (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">
                {isFinalRevision
                  ? 'Permanent Rejection Warning'
                  : 'Rejection Notice'}
              </p>
              <p
                className={
                  isFinalRevision
                    ? 'text-xs text-red-800 leading-relaxed'
                    : 'text-xs text-amber-800 leading-relaxed'
                }
              >
                {isFinalRevision
                  ? `This application has reached the ceiling of 3 correction revisions (Current is v4). Rejecting this revision triggers PERMANENT REJECTION. The institution will be barred from resubmission, and data retention policies will schedule 7-day archival.`
                  : `Rejecting this application will transition status to REJECTED. The college administrator will be permitted to start correction revision v${college.resubmissionCount + 2} (${college.resubmissionCount + 1} of 3 correction cycles used).`}
              </p>
            </div>
          </div>
        )}

        {/* Concurrency Version Badge */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Optimistic Locking: Bound to server concurrency version{' '}
            <strong>#{college.concurrencyVersion}</strong>
          </span>
        </div>

        {/* REJECTION REASON (Required for REJECT) */}
        {action === 'REJECT' && (
          <div className="space-y-1">
            <Textarea
              label="Rejection Reason"
              required
              rows={4}
              placeholder="State clear, constructive reasons explaining why the application is being rejected (minimum 10 characters)..."
              error={errors.rejectionReason?.message}
              {...register('rejectionReason')}
            />
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>Minimum 10 characters</span>
              <span>{rejectionVal.length}/1000</span>
            </div>
          </div>
        )}

        {/* REVIEW NOTES (Required for REQUEST_ACTION, optional for APPROVE & REJECT) */}
        <div className="space-y-1">
          <Textarea
            label={
              action === 'REQUEST_ACTION'
                ? 'Action Required Notes / Instructions'
                : 'Review Notes (Optional)'
            }
            required={action === 'REQUEST_ACTION'}
            rows={action === 'REQUEST_ACTION' ? 4 : 3}
            placeholder={
              action === 'REQUEST_ACTION'
                ? 'Specify exactly what information, profile corrections, or verification documents the administrator must update (minimum 10 characters)...'
                : 'Optional notes recorded in the permanent institutional audit history...'
            }
            error={errors.notes?.message}
            {...register('notes')}
          />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>
              {action === 'REQUEST_ACTION'
                ? 'Minimum 10 characters'
                : 'Optional internal notes'}
            </span>
            <span>{notesVal.length}/2000</span>
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
            variant={
              action === 'APPROVE'
                ? 'primary'
                : action === 'REQUEST_ACTION'
                ? 'outline'
                : 'danger'
            }
            className={
              action === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : action === 'REQUEST_ACTION'
                ? 'border-amber-500 text-amber-800 hover:bg-amber-100'
                : ''
            }
            disabled={isPending}
          >
            {isPending
              ? 'Submitting Decision...'
              : action === 'APPROVE'
              ? 'Confirm Approval'
              : action === 'REQUEST_ACTION'
              ? 'Send Action Request'
              : isFinalRevision
              ? 'Confirm Permanent Rejection'
              : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
