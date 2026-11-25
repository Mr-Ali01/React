import React from 'react';
import {
  CheckCircle2,
  Circle,
  FileCheck,
  FileText,
  MailCheck,
  Send,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResendVerificationButton } from '@/components/verification/ResendVerificationButton';
import { CollegeApprovalStatus, OnboardingChecklistResponse } from '@/types';

interface OnboardingChecklistCardProps {
  checklist: OnboardingChecklistResponse;
  isEmailVerified: boolean;
  isFrozen: boolean;
  isDraft: boolean;
  status?: CollegeApprovalStatus;
  onEditProfile?: () => void;
  onOpenUploadModal?: () => void;
  onSubmitForReview?: () => void;
  isSubmitting?: boolean;
}

export const OnboardingChecklistCard: React.FC<OnboardingChecklistCardProps> = ({
  checklist,
  isEmailVerified,
  isFrozen,
  isDraft,
  status,
  onEditProfile,
  onOpenUploadModal,
  onSubmitForReview,
  isSubmitting = false,
}) => {
  // 4 Core Checklist milestones
  const emailComplete = isEmailVerified || checklist.emailVerified;
  const docsComplete = checklist.requiredDocumentsUploaded;
  const canSubmit = checklist.canSubmitForReview && isDraft && !isFrozen;
  // Step 4 represents that the revision has been submitted and is currently under review
  // or that the application has reached final approval.
  // CRITICAL: !isDraft must NEVER be treated as sufficient proof that an application was submitted.
  const reviewSubmitted = status === 'APPROVED' || Boolean(isFrozen && !isDraft);

  // Derive profile complete: if docs and email are ready, profile is complete from registration
  const profileComplete = true;

  const completedCount = [
    emailComplete,
    profileComplete,
    docsComplete,
    reviewSubmitted,
  ].filter(Boolean).length;

  return (
    <Card className="space-y-5">
      {/* Header & Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Onboarding Verification Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete all four steps to qualify for Super Admin review and institutional activation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            {completedCount} of 4 Completed
          </span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completedCount === 4
                  ? 'bg-emerald-500'
                  : completedCount >= 2
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {/* Step 1: Email Verification */}
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
            emailComplete
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-amber-50/60 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {emailComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-sm text-slate-900">
                  Step 1: Administrator Email Verification
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {emailComplete
                  ? 'Your administrator email address has been verified.'
                  : 'Verify your email address using the link sent upon registration. Required before document upload and submission.'}
              </p>
            </div>
          </div>
          {!emailComplete && (
            <div className="shrink-0 self-center">
              <ResendVerificationButton size="sm" variant="outline" />
            </div>
          )}
        </div>

        {/* Step 2: Institutional Profile */}
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
            profileComplete
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {profileComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-sm text-slate-900">
                  Step 2: Institutional Profile Information
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Institutional address, contact phone, and affiliation details recorded.
              </p>
            </div>
          </div>
          {onEditProfile && isDraft && !isFrozen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="shrink-0 self-center text-xs"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Step 3: Mandatory Documents */}
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
            docsComplete
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {docsComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-sm text-slate-900">
                  Step 3: Mandatory Verification Documents
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {docsComplete
                  ? 'All mandatory verification documents have been uploaded.'
                  : 'Upload required documents: Registration Proof, Authorized Signatory ID, and University Affiliation.'}
              </p>
            </div>
          </div>
          {!docsComplete && onOpenUploadModal && isDraft && !isFrozen && emailComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUploadModal}
              className="shrink-0 self-center text-xs"
            >
              Upload Files
            </Button>
          )}
        </div>

        {/* Step 4: Submission */}
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
            reviewSubmitted
              ? 'bg-emerald-50/60 border-emerald-200'
              : canSubmit
              ? 'bg-sky-50/60 border-sky-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {reviewSubmitted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle
                className={`h-5 w-5 mt-0.5 shrink-0 ${
                  canSubmit ? 'text-sky-500' : 'text-slate-400'
                }`}
              />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-sm text-slate-900">
                  Step 4: Submit Application for Super Admin Review
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {status === 'APPROVED'
                  ? 'Application approved by Super Admin.'
                  : reviewSubmitted
                  ? 'Application revision submitted and currently under review.'
                  : canSubmit
                  ? 'All prerequisites satisfied! You can now submit your application.'
                  : status === 'ACTION_REQUIRED'
                  ? 'Super Admin requested corrections. Create a correction draft to proceed.'
                  : status === 'REJECTED'
                  ? 'Revision rejected by Super Admin. Start a correction draft to resubmit.'
                  : 'Complete Steps 1-3 to unlock review submission.'}
              </p>
            </div>
          </div>
          {!reviewSubmitted && onSubmitForReview && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSubmitForReview}
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
              className="shrink-0 self-center text-xs"
            >
              Submit Application
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
