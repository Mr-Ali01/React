import React from 'react';
import { RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ResubmissionAllowanceBadgeProps {
  resubmissionCount: number;
  actionRequiredCount: number;
  className?: string;
  showDetails?: boolean;
}

export const ResubmissionAllowanceBadge: React.FC<
  ResubmissionAllowanceBadgeProps
> = ({
  resubmissionCount,
  actionRequiredCount,
  className,
  showDetails = true,
}) => {
  // Correct semantics: resubmissionCount tracks submitted correction revisions (0 = v1, 1 = v2, 2 = v3, 3 = v4)
  const isInitial = resubmissionCount === 0;
  const isMaxResubmission = resubmissionCount >= 3;
  const isMaxActionRequired = actionRequiredCount >= 10;

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      {/* Resubmission Cycle Badge */}
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          isInitial
            ? 'bg-slate-100 text-slate-700 border-slate-200'
            : isMaxResubmission
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        )}
        title={
          isInitial
            ? 'Initial submission (Revision v1)'
            : `Correction Revision v${resubmissionCount + 1} (${resubmissionCount}/3 correction revisions used)`
        }
      >
        <RefreshCw className="h-3 w-3" />
        {isInitial
          ? 'Initial Submission (v1)'
          : `Correction v${resubmissionCount + 1} (${resubmissionCount}/3)`}
      </span>

      {/* Action Required Count Badge */}
      {showDetails && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border',
            isMaxActionRequired
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          )}
          title={`Action requests: ${actionRequiredCount}/10 maximum`}
        >
          {actionRequiredCount}/10 action cycles
        </span>
      )}

      {/* Warnings */}
      {isMaxResubmission && showDetails && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"
          title="Maximum correction revisions reached. A subsequent rejection triggers permanent rejection."
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Final Revision
        </span>
      )}

      {isMaxActionRequired && showDetails && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"
          title="Action requests have reached the ceiling of 10. Further action requests are prohibited."
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Action Ceiling Reached
        </span>
      )}
    </div>
  );
};
