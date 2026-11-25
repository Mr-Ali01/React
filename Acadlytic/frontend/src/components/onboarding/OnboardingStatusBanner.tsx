import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  Lock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { isApplicationFrozenInReview, isDraftEditable } from '@/hooks/useOnboarding';
import { MyApplicationResponse } from '@/types';

interface OnboardingStatusBannerProps {
  application: MyApplicationResponse;
  onStartCorrection?: () => void;
  isStartingCorrection?: boolean;
  onOpenHistory?: () => void;
}

export const OnboardingStatusBanner: React.FC<OnboardingStatusBannerProps> = ({
  application,
  onStartCorrection,
  isStartingCorrection = false,
  onOpenHistory,
}) => {
  const { currentRevision, resubmission, checklist, college } = application;
  const status = currentRevision.status;
  const isFrozen = isApplicationFrozenInReview(currentRevision, checklist);
  const isDraft = isDraftEditable(currentRevision);

  const getStatusBadge = () => {
    switch (status) {
      case 'PENDING':
        if (isFrozen) {
          return {
            bg: 'bg-sky-50 text-sky-800 border-sky-200',
            icon: <Clock className="h-4 w-4 text-sky-600" />,
            label: 'Under Review — Application Frozen',
          };
        }
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: <Clock className="h-4 w-4 text-sky-600" />,
          label: 'Draft — Pending Submission',
        };
      case 'ACTION_REQUIRED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
          label: 'Action Required — Corrections Needed',
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <XCircle className="h-4 w-4 text-rose-600" />,
          label: 'Application Rejected',
        };
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          label: 'Application Approved',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <AlertCircle className="h-4 w-4 text-slate-500" />,
          label: status,
        };
    }
  };

  const badge = getStatusBadge();

  // Show "Start Correction Draft" if ACTION_REQUIRED or non-permanent REJECTED, and currently uneditable (not a draft)
  const canStartCorrection =
    (status === 'ACTION_REQUIRED' || status === 'REJECTED') &&
    !currentRevision.isDraft &&
    checklist.canStartCorrectionDraft;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
      {/* Top Row: Title, Status Badge, Revision Badge, History Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {college.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {`Revision v${currentRevision.versionNumber}${currentRevision.isDraft ? ' (Draft)' : ''}`}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            College Code:{' '}
            <span className="font-mono font-medium text-slate-700">
              {college.code}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHistory && application.revisionHistory?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHistory}
              className="text-xs"
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Revision History ({application.revisionHistory.length})
            </Button>
          )}

          {canStartCorrection && onStartCorrection && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartCorrection}
              isLoading={isStartingCorrection}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Start Correction Draft
            </Button>
          )}
        </div>
      </div>

      {/* Resubmission Counters and Allowances */}
      {resubmission && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg p-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">
              Rejection Resubmissions:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {resubmission.resubmissionCount} / {resubmission.maxRejections}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">
              Action Required Cycles:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {resubmission.actionRequiredCount} / {resubmission.maxActionRequired}
            </span>
          </div>
          {!checklist.canStartCorrectionDraft && status === 'REJECTED' && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Maximum resubmissions reached. Further revisions are locked.
              </span>
            </>
          )}
        </div>
      )}

      {/* Frozen in Review Banner */}
      {isFrozen && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-sm">
          <Lock className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Application Locked for Review</p>
            <p className="text-xs text-sky-800 leading-relaxed">
              Your application is currently under Super Admin review. Details, documents, and submissions
              are locked and cannot be modified until the review process concludes.
            </p>
          </div>
        </div>
      )}

      {/* Unsubmitted Draft Notice */}
      {isDraft && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <FileEdit className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Unsubmitted Correction Draft</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              You are currently working in an unsubmitted draft revision (v
              {currentRevision.versionNumber}). Update profile information, upload requested documents,
              and submit the revised application when ready.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
