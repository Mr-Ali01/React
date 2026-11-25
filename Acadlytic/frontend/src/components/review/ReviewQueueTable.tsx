import React from 'react';
import { Eye, FileText, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ResubmissionAllowanceBadge } from './ResubmissionAllowanceBadge';
import type { ReviewQueueItemResponse } from '@/types';

interface ReviewQueueTableProps {
  items: ReviewQueueItemResponse[];
  isLoading: boolean;
  onReviewClick: (collegeId: number) => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
  items,
  isLoading,
  onReviewClick,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">
          Loading pending review queue...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No Applications Pending Review
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          There are currently no college registration applications awaiting
          verification matching your search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>College Information</TableHead>
            <TableHead>Revision & Allowance</TableHead>
            <TableHead>Administrator</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead className="text-center">Documents</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.collegeId} className="hover:bg-slate-50/70">
              {/* College Information */}
              <TableCell>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 text-sm">
                    {item.legalName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      <Tag className="h-3 w-3" />
                      {item.collegeCode}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Revision & Allowance */}
              <TableCell>
                <ResubmissionAllowanceBadge
                  resubmissionCount={item.resubmissionCount}
                  actionRequiredCount={item.actionRequiredCount}
                />
              </TableCell>

              {/* Administrator */}
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{item.adminName}</p>
                  <p className="text-xs text-slate-500">{item.adminEmail}</p>
                </div>
              </TableCell>

              {/* Submitted At */}
              <TableCell className="text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {new Date(item.submittedForReviewAt).toLocaleDateString()}{' '}
                    {new Date(item.submittedForReviewAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </TableCell>

              {/* Documents */}
              <TableCell className="text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {item.documentCount} {item.documentCount === 1 ? 'doc' : 'docs'}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onReviewClick(item.collegeId)}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
