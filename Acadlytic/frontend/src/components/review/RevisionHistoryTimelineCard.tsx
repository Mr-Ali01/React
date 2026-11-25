import React from 'react';
import { History, ShieldCheck, AlertCircle, XCircle, User, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';
import type { ReviewHistoryItemResponse } from '@/types';

interface RevisionHistoryTimelineCardProps {
  reviewHistory?: ReviewHistoryItemResponse[];
}

export const RevisionHistoryTimelineCard: React.FC<
  RevisionHistoryTimelineCardProps
> = ({ reviewHistory = [] }) => {
  const history = reviewHistory ?? [];

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3 w-3" />
            Approved
          </span>
        );
      case 'REQUEST_ACTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="h-3 w-3" />
            Action Requested
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {decision}
          </span>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />
          Review & Decision History ({history.length})
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Authoritative Audit Trail
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No prior review decisions recorded for this college.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="relative space-y-2">
              {/* Dot */}
              <div
                className={clsx(
                  'absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-white',
                  item.decision === 'APPROVE'
                    ? 'border-emerald-500'
                    : item.decision === 'REQUEST_ACTION'
                    ? 'border-amber-500'
                    : 'border-red-500'
                )}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getDecisionBadge(item.decision)}
                  <span className="text-xs font-mono text-slate-500">
                    Cycle (Action: {item.actionRequiredCountAtDecision ?? 0}/10,
                    Correction: v{(item.resubmissionCountAtDecision ?? (item.versionNumber > 0 ? item.versionNumber - 1 : 0)) + 1})
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.decisionByAdminEmail ||
                      (item.reviewerUserId
                        ? `Reviewer #${item.reviewerUserId}`
                        : 'Super Admin')}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.decisionAt
                      ? new Date(item.decisionAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {item.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                  <span className="font-semibold block mb-0.5">
                    Rejection Reason:
                  </span>
                  <p className="whitespace-pre-wrap">{item.rejectionReason}</p>
                </div>
              )}

              {(item.reviewNotes || item.notes) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                  <span className="font-semibold block mb-0.5">
                    Review Notes / Feedback:
                  </span>
                  <p className="whitespace-pre-wrap">
                    {item.reviewNotes || item.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
