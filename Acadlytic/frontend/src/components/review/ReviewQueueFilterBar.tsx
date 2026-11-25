import React from 'react';
import { Search, RotateCcw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ReviewQueueFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  dateError?: string | null;
}

export const ReviewQueueFilterBar: React.FC<ReviewQueueFilterBarProps> = ({
  search,
  onSearchChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  sort,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  dateError,
}) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label
            htmlFor="review-queue-search"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="review-queue-search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by college name, code, or admin email..."
              className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Date Filter: From */}
        <div className="w-full sm:w-44">
          <label
            htmlFor="review-queue-from-date"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            From Date
          </label>
          <input
            id="review-queue-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
          />
        </div>

        {/* Date Filter: To */}
        <div className="w-full sm:w-44">
          <label
            htmlFor="review-queue-to-date"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            To Date
          </label>
          <input
            id="review-queue-to-date"
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
          />
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-56">
          <label
            htmlFor="review-queue-sort"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Sort Order
          </label>
          <select
            id="review-queue-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
          >
            <option value="submittedForReviewAt,asc">
              Submission (Oldest First)
            </option>
            <option value="submittedForReviewAt,desc">
              Submission (Newest First)
            </option>
            <option value="legalName,asc">College Name (A-Z)</option>
            <option value="legalName,desc">College Name (Z-A)</option>
            <option value="createdAt,asc">Created (Oldest First)</option>
            <option value="createdAt,desc">Created (Newest First)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 h-[38px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        )}
      </div>

      {dateError && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{dateError}</span>
        </div>
      )}
    </Card>
  );
};
