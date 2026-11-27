import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import type {
  DocumentVerificationStatus,
  DocumentVerificationProvenance,
} from '@/types';

interface DocumentStatusBadgeProps {
  status: DocumentVerificationStatus | string | null | undefined;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'ACCEPTED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
          title="Verification Status: Accepted by Super Admin"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Accepted
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200 ${className}`}
          title="Verification Status: Rejected. Corrections required."
        >
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          Rejected
        </span>
      );

    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
          title="Verification Status: Pending Super Admin review"
        >
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          Pending Verification
        </span>
      );

    default:
      // Fail-closed data integrity warning: unknown, missing or malformed status
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-300 ${className}`}
          title="Data Integrity Error: Unrecognized or missing verification status. Review actions locked."
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-700" />
          Invalid Status
        </span>
      );
  }
};

interface DocumentProvenanceBadgeProps {
  provenance: DocumentVerificationProvenance | string | null | undefined;
  className?: string;
}

export const DocumentProvenanceBadge: React.FC<DocumentProvenanceBadgeProps> = ({
  provenance,
  className = '',
}) => {
  switch (provenance) {
    case 'DIRECT_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
          title="Provenance: Explicitly reviewed and decided by a Super Admin"
        >
          <ShieldCheck className="h-3 w-3 text-sky-600" />
          Direct Review
        </span>
      );

    case 'CARRIED_FORWARD':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
          title="Provenance: Accepted in a prior revision and automatically carried forward"
        >
          <RotateCcw className="h-3 w-3 text-indigo-600" />
          Carried Forward
        </span>
      );

    case 'LEGACY_COLLEGE_APPROVAL':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
          title="Provenance: Document verified under legacy college approval"
        >
          <ShieldCheck className="h-3 w-3 text-slate-500" />
          Legacy Approved
        </span>
      );

    case 'NOT_REVIEWED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`}
          title="Provenance: Uploaded document has not yet been reviewed"
        >
          <HelpCircle className="h-3 w-3 text-slate-400" />
          Not Reviewed
        </span>
      );

    default:
      // Fail-closed data integrity warning: unknown, missing or malformed provenance
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
          title="Data Integrity Error: Unrecognized or missing verification provenance."
        >
          <AlertTriangle className="h-3 w-3 text-amber-700" />
          Invalid Provenance
        </span>
      );
  }
};
