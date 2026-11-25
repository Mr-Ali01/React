import React from 'react';
import {
  Award,
  Calendar,
  FileCheck2,
  FileText,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  CollegeApprovalStatus,
  CollegeStatus,
  OnboardingChecklistResponse,
} from '@/types';

interface ActivationMilestoneCardProps {
  versionNumber?: number;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  checklist?: OnboardingChecklistResponse;
  approvalStatus?: CollegeApprovalStatus;
  collegeStatus?: CollegeStatus;
  onOpenDossier: () => void;
}

export const ActivationMilestoneCard: React.FC<
  ActivationMilestoneCardProps
> = ({
  versionNumber = 1,
  reviewedAt,
  reviewNotes,
  checklist,
  approvalStatus = 'APPROVED',
  collegeStatus = 'ACTIVE',
  onOpenDossier,
}) => {
  const formattedReviewDate = reviewedAt
    ? new Date(reviewedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Verified upon activation';

  // Authoritative checklist derivation
  const isEmailVerified = Boolean(checklist?.emailVerified);
  const areDocumentsUploaded = Boolean(checklist?.requiredDocumentsUploaded);
  const isApproved = approvalStatus === 'APPROVED';
  const isOperationallyActive = collegeStatus === 'ACTIVE';

  const milestones = [
    {
      title: 'Institutional Registration & Verification',
      description: 'Account registered and administrative email address verified.',
      completed: isEmailVerified,
      icon: MailCheck,
    },
    {
      title: 'Compliance Accreditation Documentation',
      description: 'Mandatory affiliation and signatory documents submitted for approved revision.',
      completed: areDocumentsUploaded,
      icon: FileCheck2,
    },
    {
      title: 'Super Admin Approval & Review',
      description: `Application reviewed and formally approved under revision v${versionNumber}.`,
      completed: isApproved,
      icon: ShieldCheck,
    },
    {
      title: 'Academic Tenancy Operational Activation',
      description: 'Platform tenancy activated with full institutional authority.',
      completed: isOperationallyActive,
      icon: Award,
    },
  ];

  return (
    <Card className="p-6 space-y-6">
      {/* Header with Approved Revision Details */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Approval Milestone &amp; Readiness
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Approved Revision v{versionNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Approved: {formattedReviewDate}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDossier}
          className="self-start sm:self-auto flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <FileText className="h-4 w-4 text-indigo-600" />
          <span>View Approved Registration Dossier</span>
        </Button>
      </div>

      {/* Reviewer Feedback / Notes (if present) */}
      {reviewNotes && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Super Admin Review Notes:</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed italic pl-5">
            &ldquo;{reviewNotes}&rdquo;
          </p>
        </div>
      )}

      {/* Authoritative Onboarding Milestone Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Authoritative Verification Milestones
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    item.completed
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        item.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
