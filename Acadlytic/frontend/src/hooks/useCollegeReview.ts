import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { queryKeys } from '@/services/queryKeys';
import type {
  ReviewQueueParams,
  ReviewDecisionRequest,
} from '@/types';

/**
 * Hook to fetch the paginated pending review queue with search, filter, and sorting.
 */
export function useReviewQueue(params?: ReviewQueueParams) {
  return useQuery({
    queryKey: queryKeys.reviews.queue(params),
    queryFn: () => reviewService.getReviewQueue(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch full review detail for a single college.
 */
export function useReviewDetail(collegeId: number) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(collegeId),
    queryFn: () => reviewService.getReviewDetail(collegeId),
    enabled: Boolean(collegeId && !isNaN(collegeId) && collegeId > 0),
  });
}

/**
 * Hook to submit an authoritative review decision (APPROVE, REQUEST_ACTION, REJECT).
 * On success, invalidates the entire review queue root and the specific detail query.
 */
export function useRecordDecision(collegeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewDecisionRequest) =>
      reviewService.recordReviewDecision(collegeId, data),
    onSuccess: () => {
      // Invalidate all active pages and filter variations in review queue
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.queueRoot(),
      });
      // Invalidate current college review detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.detail(collegeId),
      });
    },
  });
}

/**
 * Hook to download a verification document.
 */
export function useDownloadReviewDocument() {
  return useMutation({
    mutationFn: ({
      collegeId,
      documentId,
      filename,
    }: {
      collegeId: number;
      documentId: number;
      filename?: string;
    }) => reviewService.downloadReviewDocument(collegeId, documentId, filename),
  });
}
