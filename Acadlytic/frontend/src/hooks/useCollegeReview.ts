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
  DocumentReviewDecisionRequest,
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
 * On success, invalidates the entire review queue root.
 * Does NOT invalidate current college review detail to prevent HTTP 409 Conflict,
 * because decisions transition the application out of PENDING status.
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

/**
 * Hook to submit an authoritative document review decision (ACCEPT or REJECT).
 * On success, invalidates parent college review detail to refresh document status, badges, and versions.
 */
export function useRecordDocumentDecision(collegeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      request,
    }: {
      documentId: number;
      request: DocumentReviewDecisionRequest;
    }) => reviewService.recordDocumentDecision(collegeId, documentId, request),
    onSuccess: (_, variables) => {
      // Invalidate current college review detail (refreshes activeDocuments, statuses, and versions)
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.detail(collegeId),
      });
      // Invalidate document history query if open
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.documentHistory(
          collegeId,
          variables.documentId
        ),
      });
    },
  });
}

/**
 * Hook to fetch chronological review decision history records for an individual document.
 * Unblocked by college lifecycle freeze (read-only audit trail).
 */
export function useDocumentReviewHistory(
  collegeId: number,
  documentId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.reviews.documentHistory(collegeId, documentId),
    queryFn: () => reviewService.getDocumentReviewHistory(collegeId, documentId),
    enabled: Boolean(
      enabled &&
        collegeId > 0 &&
        !isNaN(collegeId) &&
        documentId > 0 &&
        !isNaN(documentId)
    ),
  });
}
