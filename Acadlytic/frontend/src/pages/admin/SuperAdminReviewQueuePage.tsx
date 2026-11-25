import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  ReviewQueueFilterBar,
  ReviewQueueTable,
} from '@/components/review';
import { useReviewQueue } from '@/hooks/useCollegeReview';
import type { ReviewQueueParams } from '@/types';

export const SuperAdminReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('submittedForReviewAt,asc');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Validate Date Range client-side
  const dateError = useMemo(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from > to) {
        return 'Start date cannot be after end date.';
      }
    }
    return null;
  }, [fromDate, toDate]);

  // Construct query parameters
  const queryParams = useMemo<ReviewQueueParams>(() => {
    const params: ReviewQueueParams = {
      page,
      size: pageSize,
      sort,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    // Only pass dates if range is valid
    if (fromDate && !dateError) {
      params.from = new Date(`${fromDate}T00:00:00.000Z`).toISOString();
    }
    if (toDate && !dateError) {
      params.to = new Date(`${toDate}T23:59:59.999Z`).toISOString();
    }

    return params;
  }, [search, fromDate, toDate, sort, page, dateError]);

  const { data, isLoading, error } = useReviewQueue(queryParams);

  const hasActiveFilters = Boolean(
    search.trim() || fromDate || toDate || sort !== 'submittedForReviewAt,asc'
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0); // Reset pagination on filter change
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setPage(0);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setSort('submittedForReviewAt,asc');
    setPage(0);
  };

  const handleReviewClick = (collegeId: number) => {
    navigate(`/admin/colleges/reviews/${collegeId}`);
  };

  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const items = data?.content || [];

  return (
    <PageContainer
      title="College Approval Queue"
      subtitle="Review prospective institutional registrations, verify accreditation documents, and record official verification decisions."
      maxWidth="7xl"
    >
      {error && (
        <div className="mb-6">
          <Alert variant="error" title="Failed to Load Review Queue">
            An error occurred while communicating with the review service. Please try refreshing.
          </Alert>
        </div>
      )}

      {/* Filter and Search Bar */}
      <ReviewQueueFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        fromDate={fromDate}
        onFromDateChange={handleFromDateChange}
        toDate={toDate}
        onToDateChange={handleToDateChange}
        sort={sort}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        dateError={dateError}
      />

      {/* Review Queue Data Table */}
      <ReviewQueueTable
        items={items}
        isLoading={isLoading}
        onReviewClick={handleReviewClick}
      />

      {/* Pagination Controls */}
      {!isLoading && totalElements > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {page * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min((page + 1) * pageSize, totalElements)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900">
              {totalElements}
            </span>{' '}
            applications
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-slate-600 px-2">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
