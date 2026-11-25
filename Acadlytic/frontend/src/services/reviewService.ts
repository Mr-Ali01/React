import { apiClient } from './api';
import type {
  ApiResponse,
  PageResponse,
  ReviewQueueItemResponse,
  CollegeReviewDetailResponse,
  RawCollegeReviewDetailResponse,
  RawReviewHistoryItemResponse,
  ReviewHistoryItemResponse,
  ReviewDecisionAction,
  ReviewDecisionRequest,
  ReviewDecisionResponse,
  ReviewQueueParams,
} from '@/types';

/**
 * Normalizes raw backend CollegeReviewDetailResponse wire format into the
 * frontend presentation model required by review detail components.
 */
export function normalizeReviewDetail(
  raw: RawCollegeReviewDetailResponse | CollegeReviewDetailResponse
): CollegeReviewDetailResponse {
  const rawAny = raw as any;
  const rawCollege = raw.college as any;
  const rawAdmin = raw.adminUser as any;
  const rawSubmitted = (raw.submittedRevision ?? rawAny.currentRevision) as any;
  const rawRevisionHistory: RawReviewHistoryItemResponse[] =
    rawAny.revisionHistory ?? rawAny.reviewHistory ?? [];

  // Filter completed review decisions (past decisions made by reviewer)
  let completedReviewDecisions: ReviewHistoryItemResponse[] = [];
  if (
    Array.isArray(rawAny.reviewHistory) &&
    rawAny.reviewHistory.length > 0 &&
    !rawAny.revisionHistory
  ) {
    completedReviewDecisions = rawAny.reviewHistory;
  } else if (Array.isArray(rawRevisionHistory)) {
    completedReviewDecisions = rawRevisionHistory
      .filter((rev) => {
        // Mock data or pre-formatted items with decision property
        if ((rev as any).decision) return true;
        // Backend wire format: only revisions that were reviewed or reached a terminal/action status
        return rev.reviewedAt != null || (rev.status && rev.status !== 'PENDING');
      })
      .map((rev) => {
        const mappedDecision: ReviewDecisionAction =
          (rev as any).decision ??
          (rev.status === 'APPROVED'
            ? 'APPROVE'
            : rev.status === 'ACTION_REQUIRED'
              ? 'REQUEST_ACTION'
              : 'REJECT');

        return {
          id: rev.id,
          versionNumber: rev.versionNumber,
          decision: mappedDecision,
          notes: rev.reviewNotes ?? (rev as any).notes ?? null,
          reviewNotes: rev.reviewNotes ?? (rev as any).notes ?? null,
          rejectionReason: rev.rejectionReason ?? null,
          isPermanentRejection: rev.isPermanentRejection ?? false,
          actionRequiredCountAtDecision:
            (rev as any).actionRequiredCountAtDecision ?? 0,
          resubmissionCountAtDecision:
            (rev as any).resubmissionCountAtDecision ??
            (rev.versionNumber > 0 ? rev.versionNumber - 1 : 0),
          decisionAt: rev.reviewedAt ?? (rev as any).decisionAt ?? rev.createdAt,
          decisionByAdminEmail:
            (rev as any).decisionByAdminEmail ??
            (rev.reviewerUserId ? `Reviewer #${rev.reviewerUserId}` : 'Super Admin'),
          reviewerUserId: rev.reviewerUserId ?? null,
        };
      });
  }

  const concurrencyVersion =
    raw.concurrencyVersion ?? rawCollege?.concurrencyVersion ?? 0;

  return {
    college: {
      collegeId: rawCollege?.id ?? rawCollege?.collegeId ?? 0,
      id: rawCollege?.id ?? rawCollege?.collegeId ?? 0,
      collegeCode: rawCollege?.code ?? rawCollege?.collegeCode ?? '',
      code: rawCollege?.code ?? rawCollege?.collegeCode ?? '',
      legalName:
        rawSubmitted?.legalName ??
        rawCollege?.legalName ??
        rawCollege?.name ??
        '',
      name: rawCollege?.name ?? rawCollege?.legalName ?? '',
      approvalStatus: rawCollege?.approvalStatus,
      status: rawCollege?.status,
      registrationId: rawSubmitted?.id ?? rawCollege?.registrationId,
      versionNumber:
        rawSubmitted?.versionNumber ?? rawCollege?.versionNumber ?? 1,
      submittedForReviewAt:
        rawSubmitted?.submittedForReviewAt ??
        rawCollege?.submittedForReviewAt ??
        null,
      concurrencyVersion,
      resubmissionCount: rawCollege?.resubmissionCount ?? 0,
      actionRequiredCount: rawCollege?.actionRequiredCount ?? 0,
      permanentlyRejected: rawCollege?.permanentlyRejected ?? false,
    },
    adminUser: rawAdmin
      ? {
        id: rawAdmin.id,
        fullName:
          rawAdmin.fullName ??
          (`${rawAdmin.firstName ?? ''} ${rawAdmin.lastName ?? ''}`.trim() ||
            'Administrator'),
        email: rawAdmin.email,
        phone: rawAdmin.phone ?? rawSubmitted?.contactPhone ?? null,
        emailVerified:
          rawAdmin.emailVerified !== undefined
            ? Boolean(rawAdmin.emailVerified)
            : Boolean(rawAdmin.emailVerifiedAt),
        registeredAt: rawAdmin.registeredAt ?? rawAdmin.createdAt,
      }
      : null,
    activeDocuments: raw.activeDocuments ?? [],
    currentRevision: rawSubmitted
      ? {
        ...rawSubmitted,
        isDraft: false,
      }
      : rawAny.currentRevision,
    submittedRevision: rawSubmitted,
    submittedRevisions: rawRevisionHistory.map((rev) => ({
      id: rev.id,
      versionNumber: rev.versionNumber,
      status: rev.status,
      legalName: rev.legalName,
      addressLine1: (rev as any).addressLine1 ?? '',
      addressLine2: (rev as any).addressLine2 ?? null,
      city: (rev as any).city ?? '',
      state: (rev as any).state ?? '',
      country: (rev as any).country ?? '',
      postalCode: (rev as any).postalCode ?? '',
      websiteUrl: (rev as any).websiteUrl ?? null,
      contactPhone: (rev as any).contactPhone ?? '',
      affiliatedUniversityName: (rev as any).affiliatedUniversityName ?? '',
      submittedForReviewAt: rev.submittedForReviewAt ?? null,
      reviewedAt: rev.reviewedAt ?? null,
      isDraft: false,
    })),
    reviewHistory: completedReviewDecisions,
    revisionHistory: rawRevisionHistory,
    concurrencyVersion,
  };
}

/**
 * Super Admin College Review API Service.
 * Implements communication with backend CollegeReviewController.
 */
export const reviewService = {
  /**
   * Retrieves paginated, filtered pending review queue.
   * Endpoint: GET /api/v1/super-admin/colleges/reviews
   */
  async getReviewQueue(
    params?: ReviewQueueParams
  ): Promise<PageResponse<ReviewQueueItemResponse>> {
    const cleanParams: Record<string, string | number> = {};

    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params?.from && params.from.trim()) {
      cleanParams.from = params.from.trim();
    }
    if (params?.to && params.to.trim()) {
      cleanParams.to = params.to.trim();
    }
    if (params?.page !== undefined && params.page >= 0) {
      cleanParams.page = params.page;
    }
    if (params?.size !== undefined && params.size > 0) {
      cleanParams.size = params.size;
    }
    if (params?.sort && params.sort.trim()) {
      cleanParams.sort = params.sort.trim();
    }

    const response = await apiClient.get<
      ApiResponse<PageResponse<ReviewQueueItemResponse>>
    >('/super-admin/colleges/reviews', { params: cleanParams });

    return response.data.data;
  },

  /**
   * Retrieves full review detail, admin credentials, active documents,
   * submitted revision, and complete review audit history for a college.
   * Normalizes authoritative backend wire format into presentation models.
   * Endpoint: GET /api/v1/super-admin/colleges/reviews/{collegeId}
   */
  async getReviewDetail(
    collegeId: number
  ): Promise<CollegeReviewDetailResponse> {
    const response = await apiClient.get<
      ApiResponse<RawCollegeReviewDetailResponse>
    >(`/super-admin/colleges/reviews/${collegeId}`);

    return normalizeReviewDetail(response.data.data);
  },

  /**
   * Streams a verification document with safe attachment headers.
   * Employs delayed object URL revocation (60s) to guarantee browser download manager
   * finishes spooling binary content before releasing memory.
   * Endpoint: GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}
   */
  async downloadReviewDocument(
    collegeId: number,
    documentId: number,
    originalFilename?: string
  ): Promise<void> {
    const response = await apiClient.get(
      `/super-admin/colleges/reviews/${collegeId}/documents/${documentId}`,
      {
        responseType: 'blob',
      }
    );

    const contentType =
      (response.headers['content-type'] as string) ||
      'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const objectUrl = window.URL.createObjectURL(blob);

    const filename = originalFilename || `document-${documentId}.pdf`;
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.setAttribute('download', filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Asynchronous cleanup with 60s delay
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 60000);
  },

  /**
   * Records an authoritative Super Admin review decision (APPROVE, REQUEST_ACTION, REJECT).
   * Maps notes to reviewNotes expected by backend ReviewDecisionRequest.
   * Endpoint: POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision
   */
  async recordReviewDecision(
    collegeId: number,
    request: ReviewDecisionRequest
  ): Promise<ReviewDecisionResponse> {
    const payload = {
      action: request.action,
      expectedVersion: request.expectedVersion,
      reviewNotes: request.reviewNotes ?? request.notes ?? null,
      rejectionReason: request.rejectionReason ?? null,
    };
    const response = await apiClient.post<
      ApiResponse<ReviewDecisionResponse>
    >(`/super-admin/colleges/reviews/${collegeId}/decision`, payload);

    return response.data.data;
  },
};
