import React from 'react';
import { Layers, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { SubmittedRevisionResponse } from '@/types';

interface SubmittedRevisionCardProps {
  revision: SubmittedRevisionResponse;
  isCurrent?: boolean;
}

export const SubmittedRevisionCard: React.FC<SubmittedRevisionCardProps> = ({
  revision,
  isCurrent = false,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          Submitted Revision (v{revision.versionNumber})
          {isCurrent && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Current Active Revision
            </span>
          )}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {revision.submittedForReviewAt
              ? new Date(revision.submittedForReviewAt).toLocaleString()
              : 'Pending'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">
            Legal Entity
          </span>
          <p className="font-semibold text-slate-900">{revision.legalName}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">
            Affiliated University
          </span>
          <p className="text-slate-800">{revision.affiliatedUniversityName}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">
            Location
          </span>
          <p className="text-slate-700">
            {revision.city}, {revision.state}, {revision.country}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">
            Status at Snapshot
          </span>
          <div className="mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
              {revision.status}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
