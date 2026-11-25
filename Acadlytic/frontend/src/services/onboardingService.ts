import { apiClient } from '@/services/api';
import {
  ApiResponse,
  CurrentRevisionResponse,
  DocumentCategory,
  DocumentResponse,
  MyApplicationResponse,
  SubmitApplicationResponse,
  UpdateApplicationRequest,
} from '@/types';

/**
 * Service providing API client calls for Phase 03, Module 3.3:
 * College Admin Restricted Dashboard, Document Management, and Review Submission.
 */
export const onboardingService = {
  /**
   * Retrieves the full aggregated restricted dashboard state for the authenticated college admin:
   * college summary, active revision, decoupled review feedback, resubmission counters,
   * live checklist, active documents, and revision history.
   * Endpoint: GET /api/v1/college-registrations/my-application
   */
  async getMyApplication(): Promise<MyApplicationResponse> {
    const response = await apiClient.get<ApiResponse<MyApplicationResponse>>(
      '/college-registrations/my-application'
    );
    return response.data.data;
  },

  /**
   * Creates an immutable correction draft revision (v+1) for eligible ACTION_REQUIRED or REJECTED applications.
   * Under parent College pessimistic lock, clones active documents with distinct storage keys.
   * Idempotent: returns existing draft revision if already open.
   * Endpoint: POST /api/v1/college-registrations/my-application/correction-draft
   */
  async createCorrectionDraft(): Promise<CurrentRevisionResponse> {
    const response = await apiClient.post<ApiResponse<CurrentRevisionResponse>>(
      '/college-registrations/my-application/correction-draft'
    );
    return response.data.data;
  },

  /**
   * Updates profile fields of an unsubmitted draft revision.
   * If legalName is modified, synchronizes college tenant name atomically.
   * Endpoint: PUT /api/v1/college-registrations/my-application
   */
  async updateDraftProfile(
    data: UpdateApplicationRequest
  ): Promise<CurrentRevisionResponse> {
    const response = await apiClient.put<ApiResponse<CurrentRevisionResponse>>(
      '/college-registrations/my-application',
      data
    );
    return response.data.data;
  },

  /**
   * Uploads a verification document into the active draft revision.
   * Multipart form submission with boundary generation.
   * Endpoint: POST /api/v1/college-registrations/my-application/documents
   */
  async uploadDocument(
    file: File,
    documentCategory: DocumentCategory,
    replacesDocumentId?: number | null
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentCategory', documentCategory);
    if (replacesDocumentId != null) {
      formData.append('replacesDocumentId', replacesDocumentId.toString());
    }

    const response = await apiClient.post<ApiResponse<DocumentResponse>>(
      '/college-registrations/my-application/documents',
      formData,
      {
        headers: {
          // Allows browser to set multipart/form-data with dynamic boundary
          'Content-Type': undefined,
        },
      }
    );
    return response.data.data;
  },

  /**
   * Lists active (non-superseded) verification documents for the active revision.
   * Endpoint: GET /api/v1/college-registrations/my-application/documents
   */
  async listActiveDocuments(): Promise<DocumentResponse[]> {
    const response = await apiClient.get<ApiResponse<DocumentResponse[]>>(
      '/college-registrations/my-application/documents'
    );
    return response.data.data;
  },

  /**
   * Streams a verification document with safe attachment headers.
   * Implements safe delayed URL cleanup (60s) to allow the browser download manager
   * to complete reading the blob stream into disk before releasing memory.
   * Endpoint: GET /api/v1/college-registrations/my-application/documents/{documentId}
   */
  async downloadDocument(
    documentId: number,
    originalFilename: string
  ): Promise<void> {
    const response = await apiClient.get(
      `/college-registrations/my-application/documents/${documentId}`,
      {
        responseType: 'blob',
      }
    );

    const contentType =
      (response.headers['content-type'] as string) || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.setAttribute('download', originalFilename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Asynchronous cleanup with 60s delay: gives download manager time to finish file I/O
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 60000);
  },

  /**
   * Deletes a document from the active draft revision and deterministically restores any predecessor.
   * Endpoint: DELETE /api/v1/college-registrations/my-application/documents/{documentId}
   */
  async deleteDocument(documentId: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      `/college-registrations/my-application/documents/${documentId}`
    );
  },

  /**
   * Submits or resubmits the application for Super Admin review.
   * Enforces email verified gate and mandatory document attachment.
   * Freezes revision and updates current_registration_id atomically.
   * Endpoint: POST /api/v1/college-registrations/my-application/submit
   */
  async submitApplication(): Promise<SubmitApplicationResponse> {
    const response = await apiClient.post<ApiResponse<SubmitApplicationResponse>>(
      '/college-registrations/my-application/submit'
    );
    return response.data.data;
  },
};
