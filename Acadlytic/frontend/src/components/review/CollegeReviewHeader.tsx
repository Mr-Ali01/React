import React from 'react';
import { ArrowLeft, Clock, ShieldCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ResubmissionAllowanceBadge } from './ResubmissionAllowanceBadge';
import type { CollegeReviewSummaryResponse } from '@/types';

interface CollegeReviewHeaderProps {
  college: CollegeReviewSummaryResponse;
  onBack: () => void;
}

export const CollegeReviewHeader: React.FC<CollegeReviewHeaderProps> = ({
  college,
  onBack,
}) => {
  const getStatusBadge = () => {
    switch (college.approvalStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Action Required
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {college.approvalStatus}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Review Queue
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {college.legalName || college.name || 'Unnamed Institution'}
            </h1>
            {getStatusBadge()}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              <Tag className="h-3 w-3" />
              {college.collegeCode || college.code}
            </span>
            <span>•</span>
            <span>Revision v{college.versionNumber ?? 1}</span>
            <span>•</span>
            <span>
              Submitted{' '}
              {college.submittedForReviewAt
                ? new Date(college.submittedForReviewAt).toLocaleString()
                : 'Pending'}
            </span>
          </div>

          <div className="pt-1">
            <ResubmissionAllowanceBadge
              resubmissionCount={college.resubmissionCount}
              actionRequiredCount={college.actionRequiredCount}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-start">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-slate-50 text-slate-600 border border-slate-200" title="Server Concurrency Version">
            Version #{college.concurrencyVersion}
          </span>
        </div>
      </div>
    </div>
  );
};
