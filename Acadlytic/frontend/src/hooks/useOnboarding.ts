import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '@/services/onboardingService';
import { queryKeys } from '@/services/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import {
  CurrentRevisionResponse,
  DocumentCategory,
  DocumentResponse,
  MyApplicationResponse,
  OnboardingChecklistResponse,
  SubmitApplicationResponse,
  UpdateApplicationRequest,
} from '@/types';
import { ApiError } from '@/services/api';

/**
 * Resilient derivation helper for checking whether the application is frozen in review.
 * Inspects checklist.isFrozenInReview (or frozenInReview), falling back authoritatively
 * to core revision fields (submittedForReviewAt != null, isDraft == false, status == PENDING).
 */
export function isApplicationFrozenInReview(
  currentRevision?: CurrentRevisionResponse | null,
  checklist?: OnboardingChecklistResponse | null
): boolean {
  if (checklist?.isFrozenInReview !== undefined) {
    return Boolean(checklist.isFrozenInReview);
  }
  if (checklist?.frozenInReview !== undefined) {
    return Boolean(checklist.frozenInReview);
  }
  return (
    Boolean(currentRevision && !currentRevision.isDraft) &&
    Boolean(
      currentRevision?.submittedForReviewAt &&
      currentRevision.submittedForReviewAt.trim() !== ''
    ) &&
    currentRevision?.status === 'PENDING'
  );
}

/**
 * Helper checking whether the active revision is an unsubmitted editable draft.
 * Mutations (profile edit, document upload, document delete) are permitted strictly
 * when this evaluates to true.
 *
 * Rules:
 * - Missing revision -> not editable.
 * - isDraft !== true -> not editable.
 * - isDraft === true and submittedForReviewAt is null or omitted/undefined -> editable.
 * - isDraft === true and a real submission timestamp exists -> not editable.
 */
export function isDraftEditable(
  currentRevision?: CurrentRevisionResponse | null
): boolean {
  if (!currentRevision || currentRevision.isDraft !== true) {
    return false;
  }
  return (
    currentRevision.submittedForReviewAt === null ||
    currentRevision.submittedForReviewAt === undefined ||
    currentRevision.submittedForReviewAt.trim() === ''
  );
}

/**
 * Primary query hook for retrieving the authoritative restricted dashboard aggregate.
 * Endpoint: GET /api/v1/college-registrations/my-application
 */
export function useMyApplication() {
  return useQuery<MyApplicationResponse, ApiError>({
    queryKey: queryKeys.onboarding.myApplication(),
    queryFn: () => onboardingService.getMyApplication(),
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Never retry 401 or 403 authorization failures
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

/**
 * Mutation hook for creating an immutable correction draft revision (v+1).
 * Used when application is in ACTION_REQUIRED or non-permanent REJECTED.
 * Endpoint: POST /api/v1/college-registrations/my-application/correction-draft
 */
export function useCreateCorrectionDraft() {
  const queryClient = useQueryClient();

  return useMutation<CurrentRevisionResponse, ApiError, void>({
    mutationFn: () => onboardingService.createCorrectionDraft(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.myApplication(),
      });
    },
  });
}

/**
 * Mutation hook for updating unsubmitted draft profile fields.
 * Server-confirmed: invalidates application query and synchronizes user.collegeName on success.
 * Endpoint: PUT /api/v1/college-registrations/my-application
 */
export function useUpdateDraftProfile() {
  const queryClient = useQueryClient();

  return useMutation<CurrentRevisionResponse, ApiError, UpdateApplicationRequest>({
    mutationFn: (data: UpdateApplicationRequest) =>
      onboardingService.updateDraftProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.myApplication(),
      });

      // Synchronize college tenant name in client auth store if modified
      const { user, setUser } = useAuthStore.getState();
      if (user && data.profile.legalName) {
        setUser({ ...user, collegeName: data.profile.legalName });
      }
    },
  });
}

/**
 * Mutation hook for uploading a verification document into the active draft.
 * Endpoint: POST /api/v1/college-registrations/my-application/documents
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<
    DocumentResponse,
    ApiError,
    {
      file: File;
      documentCategory: DocumentCategory;
      replacesDocumentId?: number | null;
    }
  >({
    mutationFn: ({ file, documentCategory, replacesDocumentId }) =>
      onboardingService.uploadDocument(file, documentCategory, replacesDocumentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.myApplication(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.activeDocuments(),
      });
    },
  });
}

/**
 * Mutation hook for deleting an active document from the draft revision.
 * Deterministically restores any superseded predecessor to the active set.
 * Endpoint: DELETE /api/v1/college-registrations/my-application/documents/{documentId}
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (documentId: number) =>
      onboardingService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.myApplication(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.activeDocuments(),
      });
    },
  });
}

/**
 * Mutation hook for submitting or resubmitting the application for Super Admin review.
 * Freezes revision and updates current_registration_id atomically.
 * Endpoint: POST /api/v1/college-registrations/my-application/submit
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation<SubmitApplicationResponse, ApiError, void>({
    mutationFn: () => onboardingService.submitApplication(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.myApplication(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.currentUser(),
      });
    },
  });
}
