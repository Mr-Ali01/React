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
  CollegeApprovalStatus,
  DocumentReviewDecisionRequest,
  DocumentReviewDecisionResponse,
  DocumentReviewHistoryItemResponse,
} from '@/types';

/**
 * Normalizes raw backend CollegeReviewDetailResponse wire format into the
 * frontend presentation model required by review detail components.
 * Strictly preserves authoritative backend data without unsafe fallback fabrication.
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
  // Backend lifecycle semantics:
  // 1. Initial pending v1 has reviewedAt: null and status PENDING -> must NOT enter decision history.
  // 2. Only revisions with explicit reviewedAt and verified decision statuses (APPROVED, ACTION_REQUIRED, REJECTED)
  //    represent completed review decisions. Unknown or unreviewed statuses must NEVER be converted to decisions.
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
        // Mock data with explicit valid decision action
        if ((rev as any).decision) {
          const d = (rev as any).decision;
          return d === 'APPROVE' || d === 'REQUEST_ACTION' || d === 'REJECT';
        }
        // Authoritative wire format: must be reviewed and have a verified decision status
        if (!rev.reviewedAt) {
          return false;
        }
        return (
          rev.status === 'APPROVED' ||
          rev.status === 'ACTION_REQUIRED' ||
          rev.status === 'REJECTED'
        );
      })
      .map((rev): ReviewHistoryItemResponse => {
        let mappedDecision: ReviewDecisionAction = 'APPROVE';
        if ((rev as any).decision) {
          mappedDecision = (rev as any).decision;
        } else if (rev.status === 'APPROVED') {
          mappedDecision = 'APPROVE';
        } else if (rev.status === 'ACTION_REQUIRED') {
          mappedDecision = 'REQUEST_ACTION';
        } else if (rev.status === 'REJECTED') {
          mappedDecision = 'REJECT';
        }

        return {
          id: rev.id ?? null,
          versionNumber: rev.versionNumber ?? null,
          decision: mappedDecision,
          notes: rev.reviewNotes ?? (rev as any).notes ?? null,
          reviewNotes: rev.reviewNotes ?? (rev as any).notes ?? null,
          rejectionReason: rev.rejectionReason ?? null,
          isPermanentRejection: Boolean(rev.isPermanentRejection),
          // Do not fabricate historical action counts or resubmission counts
          actionRequiredCountAtDecision:
            (rev as any).actionRequiredCountAtDecision ?? null,
          resubmissionCountAtDecision:
            (rev as any).resubmissionCountAtDecision ?? null,
          // Strictly from reviewedAt, NEVER from createdAt
          decisionAt: rev.reviewedAt ?? (rev as any).decisionAt ?? null,
          // Do not invent reviewer emails or roles
          decisionByAdminEmail: (rev as any).decisionByAdminEmail ?? null,
          reviewerUserId: rev.reviewerUserId ?? null,
        };
      });
  }

  // Authoritative root concurrencyVersion: DO NOT default to 0
  const authoritativeConcurrencyVersion =
    typeof raw.concurrencyVersion === 'number'
      ? raw.concurrencyVersion
      : typeof rawCollege?.concurrencyVersion === 'number'
        ? rawCollege.concurrencyVersion
        : null;

  // College identifiers & version: DO NOT default to 0 or 1
  const collegeId = rawCollege?.id ?? rawCollege?.collegeId ?? null;
  const versionNumber =
    rawSubmitted?.versionNumber ?? rawCollege?.versionNumber ?? null;

  return {
    college: {
      collegeId: collegeId,
      id: collegeId,
      collegeCode: rawCollege?.code ?? rawCollege?.collegeCode ?? null,
      code: rawCollege?.code ?? rawCollege?.collegeCode ?? null,
      legalName:
        rawSubmitted?.legalName ??
        rawCollege?.legalName ??
        rawCollege?.name ??
        null,
      name: rawCollege?.name ?? rawCollege?.legalName ?? null,
      approvalStatus: rawCollege?.approvalStatus,
      status: rawCollege?.status,
      registrationId: rawSubmitted?.id ?? rawCollege?.registrationId ?? null,
      versionNumber: versionNumber,
      submittedForReviewAt:
        rawSubmitted?.submittedForReviewAt ??
        rawCollege?.submittedForReviewAt ??
        null,
      concurrencyVersion: authoritativeConcurrencyVersion,
      resubmissionCount: rawCollege?.resubmissionCount ?? 0,
      actionRequiredCount: rawCollege?.actionRequiredCount ?? 0,
      permanentlyRejected: rawCollege?.permanentlyRejected ?? false,
    },
    adminUser: rawAdmin
      ? {
        id: rawAdmin.id ?? null,
        fullName:
          rawAdmin.fullName ??
          (`${rawAdmin.firstName ?? ''} ${rawAdmin.lastName ?? ''}`.trim() ||
            null),
        email: rawAdmin.email,
        phone: rawAdmin.phone ?? rawSubmitted?.contactPhone ?? null,
        emailVerified:
          rawAdmin.emailVerified !== undefined
            ? Boolean(rawAdmin.emailVerified)
            : Boolean(rawAdmin.emailVerifiedAt),
        registeredAt: rawAdmin.registeredAt ?? rawAdmin.createdAt ?? null,
      }
      : null,
    activeDocuments: raw.activeDocuments ?? [],
    currentRevision: rawSubmitted
      ? {
        ...rawSubmitted,
        isDraft: false,
      }
      : rawAny.currentRevision ?? null,
    submittedRevision: rawSubmitted ?? null,
    submittedRevisions: rawRevisionHistory.map((rev) => ({
      id: rev.id ?? null,
      versionNumber: rev.versionNumber ?? null,
      status: (rev.status as CollegeApprovalStatus) || undefined,
      legalName: rev.legalName ?? '',
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
    concurrencyVersion: authoritativeConcurrencyVersion,
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
   * Fetches raw document binary content and content-type for preview in review modals.
   * Endpoint: GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}
   */
  async getDocumentPreviewBlob(
    collegeId: number,
    documentId: number
  ): Promise<{ blob: Blob; contentType: string }> {
    if (typeof collegeId !== 'number' || isNaN(collegeId) || collegeId <= 0) {
      throw new Error('Invalid college ID for document preview');
    }
    if (typeof documentId !== 'number' || isNaN(documentId) || documentId <= 0) {
      throw new Error('Invalid document ID for document preview');
    }

    const response = await apiClient.get(
      `/super-admin/colleges/reviews/${collegeId}/documents/${documentId}`,
      {
        responseType: 'blob',
      }
    );

    const contentType =
      (response.headers['content-type'] as string) ||
      (response.headers['Content-Type'] as string) ||
      'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    return { blob, contentType };
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
    if (typeof collegeId !== 'number' || isNaN(collegeId) || collegeId <= 0) {
      throw new Error('Invalid college ID for document download');
    }
    if (typeof documentId !== 'number' || isNaN(documentId) || documentId <= 0) {
      throw new Error('Invalid document ID for document download');
    }

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

  /**
   * Records an authoritative Super Admin review decision (ACCEPT or REJECT) for an individual document.
   * Enforces optimistic version locking via expectedDocumentVersion.
   * Endpoint: POST /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision
   */
  async recordDocumentDecision(
    collegeId: number,
    documentId: number,
    request: DocumentReviewDecisionRequest
  ): Promise<DocumentReviewDecisionResponse> {
    if (typeof collegeId !== 'number' || isNaN(collegeId) || collegeId <= 0) {
      throw new Error('Invalid college ID for document review decision');
    }
    if (typeof documentId !== 'number' || isNaN(documentId) || documentId <= 0) {
      throw new Error('Invalid document ID for document review decision');
    }

    const payload = {
      action: request.action,
      expectedDocumentVersion: request.expectedDocumentVersion,
      notes: request.notes?.trim() ? request.notes.trim() : null,
      rejectionReason: request.rejectionReason?.trim()
        ? request.rejectionReason.trim()
        : null,
    };

    const response = await apiClient.post<
      ApiResponse<DocumentReviewDecisionResponse>
    >(
      `/super-admin/colleges/reviews/${collegeId}/documents/${documentId}/decision`,
      payload
    );

    return response.data.data;
  },

  /**
   * Retrieves chronological review decision history records for an individual document.
   * Unblocked by college lifecycle freeze (read-only audit trail).
   * Endpoint: GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/history
   */
  async getDocumentReviewHistory(
    collegeId: number,
    documentId: number
  ): Promise<DocumentReviewHistoryItemResponse[]> {
    if (typeof collegeId !== 'number' || isNaN(collegeId) || collegeId <= 0) {
      throw new Error('Invalid college ID for document review history');
    }
    if (typeof documentId !== 'number' || isNaN(documentId) || documentId <= 0) {
      throw new Error('Invalid document ID for document review history');
    }

    const response = await apiClient.get<
      ApiResponse<DocumentReviewHistoryItemResponse[]>
    >(
      `/super-admin/colleges/reviews/${collegeId}/documents/${documentId}/history`
    );

    return response.data.data;
  },
};
