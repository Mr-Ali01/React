import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SuperAdminReviewQueuePage } from '@/pages/admin/SuperAdminReviewQueuePage';
import { CollegeReviewDetailPage } from '@/pages/admin/CollegeReviewDetailPage';
import {
  RevisionHistoryTimelineCard,
  ReviewDocumentListCard,
  ReviewAdminUserCard,
  CollegeProfileReviewCard,
  DocumentPreviewReviewModal,
} from '@/components/review';
import { normalizeReviewDetail, reviewService } from '@/services/reviewService';
import { apiClient, ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './test-utils';
import type {
  PageResponse,
  ReviewQueueItemResponse,
  CollegeReviewDetailResponse,
  RawCollegeReviewDetailResponse,
  CurrentUser,
  DocumentResponse,
  DocumentReviewHistoryItemResponse,
} from '@/types';

// --- Mock Data ---

const mockSuperAdminUser: CurrentUser = {
  id: 1,
  email: 'superadmin@acadlytic.com',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'SUPER_ADMIN',
  collegeId: null,
  collegeApprovalStatus: null,
  collegeStatus: null,
  emailVerified: true,
  managementUnlocked: true,
};

const mockQueueItem1: ReviewQueueItemResponse = {
  collegeId: 10,
  collegeCode: 'HIT-4421',
  legalName: 'Horizon Institute of Technology',
  registrationId: 101,
  versionNumber: 1,
  status: 'PENDING',
  submittedForReviewAt: '2026-11-20T10:00:00Z',
  adminName: 'John Doe',
  adminEmail: 'admin@horizon.edu',
  resubmissionCount: 0,
  actionRequiredCount: 0,
  documentCount: 2,
};

const mockQueueItem2: ReviewQueueItemResponse = {
  collegeId: 11,
  collegeCode: 'APS-9902',
  legalName: 'Apex Polytechnic School',
  registrationId: 102,
  versionNumber: 4,
  status: 'PENDING',
  submittedForReviewAt: '2026-11-21T12:00:00Z',
  adminName: 'Jane Smith',
  adminEmail: 'admin@apex.edu',
  resubmissionCount: 3, // Final revision v4
  actionRequiredCount: 2,
  documentCount: 4,
};

const mockQueuePage: PageResponse<ReviewQueueItemResponse> = {
  content: [mockQueueItem1, mockQueueItem2],
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
  empty: false,
};

const mockEmptyQueuePage: PageResponse<ReviewQueueItemResponse> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  empty: true,
};

const mockDetailItem1: CollegeReviewDetailResponse = {
  college: {
    collegeId: 10,
    collegeCode: 'HIT-4421',
    legalName: 'Horizon Institute of Technology',
    approvalStatus: 'PENDING',
    status: 'PENDING_VERIFICATION',
    registrationId: 101,
    versionNumber: 1,
    submittedForReviewAt: '2026-11-20T10:00:00Z',
    concurrencyVersion: 5,
    resubmissionCount: 0,
    actionRequiredCount: 0,
  },
  adminUser: {
    id: 50,
    fullName: 'John Doe',
    email: 'admin@horizon.edu',
    phone: '+1-555-0199',
    emailVerified: true,
    registeredAt: '2026-11-19T08:00:00Z',
  },
  activeDocuments: [
    {
      id: 201,
      registrationId: 101,
      documentCategory: 'INSTITUTION_REGISTRATION_PROOF',
      originalFilename: 'charter_certificate.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
      sha256Checksum:
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      replacesDocumentId: null,
      createdAt: '2026-11-20T10:00:00Z',
      verificationStatus: 'ACCEPTED',
      verificationProvenance: 'DIRECT_REVIEW',
      version: 1,
    },
    {
      id: 202,
      registrationId: 101,
      documentCategory: 'AUTHORIZED_SIGNATORY_ID',
      originalFilename: 'signatory_id.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 524288,
      sha256Checksum:
        '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      replacesDocumentId: null,
      createdAt: '2026-11-20T10:05:00Z',
      verificationStatus: 'ACCEPTED',
      verificationProvenance: 'DIRECT_REVIEW',
      version: 1,
    },
    {
      id: 203,
      registrationId: 101,
      documentCategory: 'UNIVERSITY_AFFILIATION_CERTIFICATE',
      originalFilename: 'affiliation_certificate.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
      sha256Checksum:
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      replacesDocumentId: null,
      createdAt: '2026-11-20T10:10:00Z',
      verificationStatus: 'ACCEPTED',
      verificationProvenance: 'DIRECT_REVIEW',
      version: 1,
    },
  ],
  currentRevision: {
    id: 101,
    versionNumber: 1,
    status: 'PENDING',
    legalName: 'Horizon Institute of Technology',
    addressLine1: '123 Education Lane',
    addressLine2: 'Suite 400',
    city: 'Metropolis',
    state: 'NY',
    country: 'United States',
    postalCode: '10001',
    websiteUrl: 'https://horizon.edu',
    contactPhone: '+1-555-0199',
    affiliatedUniversityName: 'State Technical University',
    submittedForReviewAt: '2026-11-20T10:00:00Z',
    reviewedAt: null,
    isDraft: false,
  },
  submittedRevisions: [
    {
      id: 101,
      versionNumber: 1,
      status: 'PENDING',
      legalName: 'Horizon Institute of Technology',
      addressLine1: '123 Education Lane',
      addressLine2: 'Suite 400',
      city: 'Metropolis',
      state: 'NY',
      country: 'United States',
      postalCode: '10001',
      websiteUrl: 'https://horizon.edu',
      contactPhone: '+1-555-0199',
      affiliatedUniversityName: 'State Technical University',
      submittedForReviewAt: '2026-11-20T10:00:00Z',
      reviewedAt: null,
      isDraft: false,
    },
  ],
  reviewHistory: [
    {
      id: 301,
      versionNumber: 1,
      decision: 'REQUEST_ACTION',
      notes: 'Please attach official university affiliation certificate.',
      rejectionReason: null,
      actionRequiredCountAtDecision: 1,
      resubmissionCountAtDecision: 0,
      decisionAt: '2026-11-20T14:00:00Z',
      decisionByAdminEmail: 'superadmin@acadlytic.com',
    },
  ],
};

const mockDetailFinalRevision: CollegeReviewDetailResponse = {
  ...mockDetailItem1,
  college: {
    ...mockDetailItem1.college,
    collegeId: 11,
    collegeCode: 'APS-9902',
    legalName: 'Apex Polytechnic School',
    versionNumber: 4,
    resubmissionCount: 3, // Final revision v4
    actionRequiredCount: 2,
    concurrencyVersion: 8,
  },
};

const mockDetailMaxActionReached: CollegeReviewDetailResponse = {
  ...mockDetailItem1,
  college: {
    ...mockDetailItem1.college,
    actionRequiredCount: 10, // Ceiling reached
  },
};

describe('Module 3.4 — Super Admin Approval Queue & Review Workflow (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockSuperAdminUser,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // SECTION 1: REVIEW QUEUE PAGE TESTS
  // ==========================================

  it('1. renders review queue page with title, search, filter bar, and pending applications', async () => {
    vi.spyOn(reviewService, 'getReviewQueue').mockResolvedValueOnce(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('College Approval Queue')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search by college name, code, or admin email/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
      expect(screen.getByText('Apex Polytechnic School')).toBeInTheDocument();
    });

    expect(screen.getByText('HIT-4421')).toBeInTheDocument();
    expect(screen.getByText('APS-9902')).toBeInTheDocument();
    expect(screen.getByText('admin@horizon.edu')).toBeInTheDocument();
  });

  it('2. displays empty state when review queue contains 0 applications', async () => {
    vi.spyOn(reviewService, 'getReviewQueue').mockResolvedValueOnce(mockEmptyQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Applications Pending Review')).toBeInTheDocument();
    });
  });

  it('3. dispatches search query and resets pagination to page 0', async () => {
    const queueSpy = vi
      .spyOn(reviewService, 'getReviewQueue')
      .mockResolvedValue(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by college name, code, or admin email/i
    );
    fireEvent.change(searchInput, { target: { value: 'Horizon' } });

    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Horizon',
          page: 0,
        })
      );
    });
  });

  it('4. validates date range client-side and dispatches ISO-8601 instants when valid', async () => {
    const queueSpy = vi
      .spyOn(reviewService, 'getReviewQueue')
      .mockResolvedValue(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
    });

    // Date inputs
    const fromInput = screen.getByLabelText(/from date/i);
    const toInput = screen.getByLabelText(/to date/i);

    // Set invalid range: from > to
    fireEvent.change(fromInput, { target: { value: '2026-11-25' } });
    fireEvent.change(toInput, { target: { value: '2026-11-20' } });

    await waitFor(() => {
      expect(
        screen.getByText('Start date cannot be after end date.')
      ).toBeInTheDocument();
    });

    // Correct to valid range
    fireEvent.change(fromInput, { target: { value: '2026-11-01' } });
    fireEvent.change(toInput, { target: { value: '2026-11-25' } });

    await waitFor(() => {
      expect(
        screen.queryByText('Start date cannot be after end date.')
      ).not.toBeInTheDocument();
    });

    expect(queueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-25T23:59:59.999Z',
        page: 0,
      })
    );
  });

  it('5. changes sort order and triggers sorted fetch', async () => {
    const queueSpy = vi
      .spyOn(reviewService, 'getReviewQueue')
      .mockResolvedValue(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort order/i);
    fireEvent.change(sortSelect, { target: { value: 'legalName,asc' } });

    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'legalName,asc',
          page: 0,
        })
      );
    });
  });

  it('6. resets all filters and page when Reset button is clicked', async () => {
    vi.spyOn(reviewService, 'getReviewQueue').mockResolvedValue(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by college name, code, or admin email/i
    );
    fireEvent.change(searchInput, { target: { value: 'Apex' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });
  });

  it('7. renders resubmission semantics correctly in queue items (v1 vs v4 final)', async () => {
    vi.spyOn(reviewService, 'getReviewQueue').mockResolvedValueOnce(mockQueuePage);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // v1 initial submission has resubmissionCount = 0
      expect(screen.getByText('Initial Submission (v1)')).toBeInTheDocument();
      // v4 has resubmissionCount = 3
      expect(screen.getByText('Correction v4 (3/3)')).toBeInTheDocument();
      expect(screen.getByText('Final Revision')).toBeInTheDocument();
    });
  });

  // ==========================================
  // SECTION 2: REVIEW DETAIL DOSSIER TESTS
  // ==========================================

  it('8. renders full review detail dossier (header, admin, profile, documents, history)', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getAllByText('Horizon Institute of Technology').length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Proposed College Administrator')).toBeInTheDocument();
      expect(screen.getByText('Institutional Profile')).toBeInTheDocument();
      expect(screen.getByText(/Active Verification Documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Review & Decision History/i)).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('State Technical University')).toBeInTheDocument();
    expect(screen.getByText('charter_certificate.pdf')).toBeInTheDocument();
    expect(screen.getByText('signatory_id.pdf')).toBeInTheDocument();
    expect(screen.getByText('Version #5')).toBeInTheDocument();
  });

  it('9. renders SHA-256 checksum with truncation and full hash in title tooltip', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('charter_certificate.pdf')).toBeInTheDocument();
    });

    const checksumCode = screen.getByTitle(
      'Full SHA-256 Checksum: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    );
    expect(checksumCode).toBeInTheDocument();
    expect(checksumCode.textContent).toContain('abcdef12...');
  });

  it('10. triggers secure document streaming download with collegeId and documentId', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);
    const downloadSpy = vi
      .spyOn(reviewService, 'downloadReviewDocument')
      .mockResolvedValueOnce();

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('charter_certificate.pdf')).toBeInTheDocument();
    });

    const reviewBtn = screen.getByRole('button', {
      name: /review charter_certificate\.pdf/i,
    });
    fireEvent.click(reviewBtn);

    const downloadBtn = await screen.findByRole('button', {
      name: /^download$/i,
    });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        10,
        201,
        'charter_certificate.pdf'
      );
    });
  });

  it('11. displays previous audit history with decision badges and reviewer emails', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Action Requested')).toBeInTheDocument();
      expect(
        screen.getByText('Please attach official university affiliation certificate.')
      ).toBeInTheDocument();
      expect(screen.getByText('superadmin@acadlytic.com')).toBeInTheDocument();
    });
  });

  // ==========================================
  // SECTION 3: DECISION WORKFLOW & MODAL TESTS
  // ==========================================

  it('12. opens APPROVE decision modal with approval guidance and optimistic version info', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Approve College Registration — Horizon Institute of Technology/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Approval Confirmation')).toBeInTheDocument();
      expect(
        screen.getByText(/Optimistic Locking: Bound to server concurrency version/i)
      ).toBeInTheDocument();
    });
  });

  it('13. submits APPROVE decision with concurrencyVersion as expectedVersion', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);
    const decisionSpy = vi
      .spyOn(reviewService, 'recordReviewDecision')
      .mockResolvedValueOnce({
        collegeId: 10,
        action: 'APPROVE',
        approvalStatus: 'APPROVED',
        concurrencyVersion: 6,
        message: 'College registration approved successfully.',
      });

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    await waitFor(() => {
      expect(decisionSpy).toHaveBeenCalledWith(10, {
        action: 'APPROVE',
        notes: null,
        rejectionReason: null,
        expectedVersion: 5,
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('College registration approved successfully.')
      ).toBeInTheDocument();
    });
  });

  it('14. validates REQUEST_ACTION requires review notes of at least 10 characters', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request action/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /request action/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /send action request/i })
      ).toBeInTheDocument();
    });

    // Attempt submitting without notes
    fireEvent.click(screen.getByRole('button', { name: /send action request/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Review notes must be at least 10 characters when requesting action.')
      ).toBeInTheDocument();
    });
  });

  it('15. submits REQUEST_ACTION decision with notes and expectedVersion', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);
    const decisionSpy = vi
      .spyOn(reviewService, 'recordReviewDecision')
      .mockResolvedValueOnce({
        collegeId: 10,
        action: 'REQUEST_ACTION',
        approvalStatus: 'ACTION_REQUIRED',
        concurrencyVersion: 6,
        message: 'Action requested from college administrator.',
      });

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request action/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /request action/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /send action request/i })
      ).toBeInTheDocument();
    });

    const notesTextarea = screen.getByLabelText(/action required notes/i);
    fireEvent.change(notesTextarea, {
      target: { value: 'Please upload the latest university affiliation certificate.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send action request/i }));

    await waitFor(() => {
      expect(decisionSpy).toHaveBeenCalledWith(10, {
        action: 'REQUEST_ACTION',
        notes: 'Please upload the latest university affiliation certificate.',
        rejectionReason: null,
        expectedVersion: 5,
      });
    });
  });

  it('16. disables REQUEST_ACTION button when actionRequiredCount reaches ceiling of 10', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(
      mockDetailMaxActionReached
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const requestActionBtn = screen.getByRole('button', { name: /request action/i });
      expect(requestActionBtn).toBeDisabled();
      expect(screen.getByText('Action Ceiling Reached')).toBeInTheDocument();
    });
  });

  it('17. validates REJECT requires rejectionReason of at least 10 characters', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm rejection/i })).toBeInTheDocument();
    });

    // Attempt submit with empty rejection reason
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Rejection reason must be at least 10 characters when rejecting an application.')
      ).toBeInTheDocument();
    });
  });

  it('18. submits REJECT decision with rejectionReason and expectedVersion', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);
    const decisionSpy = vi
      .spyOn(reviewService, 'recordReviewDecision')
      .mockResolvedValueOnce({
        collegeId: 10,
        action: 'REJECT',
        approvalStatus: 'REJECTED',
        concurrencyVersion: 6,
        message: 'Application rejected.',
      });

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm rejection/i })).toBeInTheDocument();
    });

    const rejectionTextarea = screen.getByLabelText(/rejection reason/i);
    fireEvent.change(rejectionTextarea, {
      target: { value: 'Incomplete documentation and unverified signatory credentials.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    await waitFor(() => {
      expect(decisionSpy).toHaveBeenCalledWith(10, {
        action: 'REJECT',
        notes: null,
        rejectionReason:
          'Incomplete documentation and unverified signatory credentials.',
        expectedVersion: 5,
      });
    });
  });

  it('19. displays permanent rejection warning on revision v4 when resubmissionCount = 3', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(
      mockDetailFinalRevision
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/11']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reject \(permanent\)/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /reject \(permanent\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Permanent Rejection Warning')).toBeInTheDocument();
      expect(
        screen.getByText(/ceiling of 3 correction revisions/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /confirm permanent rejection/i })
      ).toBeInTheDocument();
    });
  });

  // ==========================================
  // SECTION 4: CONCURRENCY & ERROR RECOVERY TESTS
  // ==========================================

  it('20. intercepts 409 STALE_APPLICATION_VERSION, closes modal, refetches detail, and displays warning banner without retrying', async () => {
    const detailSpy = vi
      .spyOn(reviewService, 'getReviewDetail')
      .mockResolvedValue(mockDetailItem1);

    const staleError = new ApiError('Application version has changed.', {
      status: 409,
      errorCode: 'STALE_APPLICATION_VERSION',
    });

    vi.spyOn(reviewService, 'recordReviewDecision').mockRejectedValueOnce(staleError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    // Modal closes and stale conflict banner is shown
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /confirm approval/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('Application Details Updated by Concurrent Process')
      ).toBeInTheDocument();
    });

    // Detail was refetched
    expect(detailSpy).toHaveBeenCalledTimes(2);
  });

  it('21. handles 409 APPLICATION_NOT_AWAITING_REVIEW with explicit error feedback', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);

    const notAwaitingError = new ApiError('Application is not awaiting review.', {
      status: 409,
      errorCode: 'APPLICATION_NOT_AWAITING_REVIEW',
    });

    vi.spyOn(reviewService, 'recordReviewDecision').mockRejectedValueOnce(notAwaitingError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/This application is no longer awaiting review/i)
      ).toBeInTheDocument();
    });
  });

  it('21a. handles 409 DOCUMENTS_REJECTED with specific document rejection feedback inside modal without triggering stale conflict', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);

    const docRejectedError = new ApiError('Document was rejected.', {
      status: 409,
      errorCode: 'DOCUMENTS_REJECTED',
    });

    vi.spyOn(reviewService, 'recordReviewDecision').mockRejectedValueOnce(docRejectedError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    // Modal remains open and shows the specific DOCUMENTS_REJECTED error
    await waitFor(() => {
      expect(
        screen.getByText(/One or more active verification documents have been rejected/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    // Stale conflict banner should NOT be displayed
    expect(
      screen.queryByText('Application Details Updated by Concurrent Process')
    ).not.toBeInTheDocument();
  });

  it('21b. handles 409 DOCUMENTS_NOT_VERIFIED with specific unverified document feedback inside modal without triggering stale conflict', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);

    const docNotVerifiedError = new ApiError('Document pending verification.', {
      status: 409,
      errorCode: 'DOCUMENTS_NOT_VERIFIED',
    });

    vi.spyOn(reviewService, 'recordReviewDecision').mockRejectedValueOnce(docNotVerifiedError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    // Modal remains open and shows the specific DOCUMENTS_NOT_VERIFIED error
    await waitFor(() => {
      expect(
        screen.getByText(/All active verification documents must be verified and accepted before approving/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    // Stale conflict banner should NOT be displayed
    expect(
      screen.queryByText('Application Details Updated by Concurrent Process')
    ).not.toBeInTheDocument();
  });

  it('22. invalidates queueRoot and displays decision success confirmation without refetching review detail', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(mockDetailItem1);
    const detailSpy = vi.spyOn(reviewService, 'getReviewDetail');

    vi.spyOn(reviewService, 'recordReviewDecision').mockResolvedValueOnce({
      collegeId: 10,
      action: 'APPROVE',
      approvalStatus: 'APPROVED',
      concurrencyVersion: 6,
      message: 'Approved',
    });

    const { queryClient } = renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<div>Review Queue Home</div>} />
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    });

    // Clear detail spy after initial load to verify refetch is not triggered
    detailSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

    await waitFor(() => {
      // Invalidate queueRoot
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['reviews', 'queue'],
      });
      // Do NOT invalidate detail (prevents 409 refetch on approved college)
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ['reviews', 'detail', 10],
      });
      // Displays clear approval confirmation view
      expect(
        screen.getByText('College Registration Application Approved!')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Removed from Pending Review Queue')
      ).toBeInTheDocument();
    });

    // Detail endpoint was NOT refetched!
    expect(detailSpy).not.toHaveBeenCalled();

    // Return to Queue navigation works
    const returnBtn = screen.getByRole('button', { name: /return to review queue/i });
    fireEvent.click(returnBtn);
    expect(screen.getByText('Review Queue Home')).toBeInTheDocument();
  });

  it('23. disables decision action buttons when college is already APPROVED', async () => {
    const approvedDetail: CollegeReviewDetailResponse = {
      ...mockDetailItem1,
      college: {
        ...mockDetailItem1.college,
        approvalStatus: 'APPROVED',
      },
    };
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(approvedDetail);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/10']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Application is APPROVED. Review decisions can only be made on PENDING applications./i)
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
    });
  });

  it('24. renders malformed collegeId error and prevents invalid detail query', async () => {
    const detailSpy = vi.spyOn(reviewService, 'getReviewDetail');

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/abc-invalid']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Invalid Review Request')).toBeInTheDocument();
    expect(
      screen.getByText('The requested college review identifier is malformed.')
    ).toBeInTheDocument();
    expect(detailSpy).not.toHaveBeenCalled();
  });

  it('25. renders error state when review detail fetch fails (404/500)', async () => {
    vi.spyOn(reviewService, 'getReviewDetail').mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews/999']}>
        <Routes>
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application Review Error')).toBeInTheDocument();
      expect(
        screen.getByText(/The application details could not be retrieved/i)
      ).toBeInTheDocument();
    });
  });

  it('26. navigates from queue to detail page on Review button click and back via Back button', async () => {
    vi.spyOn(reviewService, 'getReviewQueue').mockResolvedValueOnce(mockQueuePage);
    vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValueOnce(mockDetailItem1);

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin/colleges/reviews']}>
        <Routes>
          <Route path="/admin/colleges/reviews" element={<SuperAdminReviewQueuePage />} />
          <Route path="/admin/colleges/reviews/:collegeId" element={<CollegeReviewDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Horizon Institute of Technology')).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /review/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Proposed College Administrator')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back to review queue/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('College Approval Queue')).toBeInTheDocument();
    });
  });

  describe('Super Admin Review API Contract Normalization & Wire Format Tests', () => {
    const rawAsterValleyPayload: RawCollegeReviewDetailResponse = {
      college: {
        id: 1,
        name: 'Aster Valley College',
        code: 'AVCAS-TEST-01',
        approvalStatus: 'PENDING',
        status: 'PENDING_VERIFICATION',
        permanentlyRejected: false,
        resubmissionCount: 0,
        actionRequiredCount: 0,
        createdAt: '2026-11-20T10:00:00Z',
      },
      adminUser: {
        id: 2,
        email: 'admin@astervalley.edu',
        firstName: 'Aster',
        lastName: 'Admin',
        emailVerifiedAt: '2026-11-20T10:05:00Z',
        createdAt: '2026-11-20T10:00:00Z',
      },
      submittedRevision: {
        id: 10,
        versionNumber: 1,
        status: 'PENDING',
        legalName: 'Aster Valley College of Arts & Science',
        addressLine1: '100 Valley Road',
        addressLine2: null,
        city: 'Emerald',
        state: 'CA',
        country: 'USA',
        postalCode: '90210',
        websiteUrl: 'https://astervalley.edu',
        contactPhone: '+1-555-4321',
        affiliatedUniversityName: 'Valley State University',
        submittedForReviewAt: '2026-11-20T10:30:00Z',
      },
      activeDocuments: [],
      revisionHistory: [
        {
          id: 10,
          versionNumber: 1,
          status: 'PENDING',
          legalName: 'Aster Valley College of Arts & Science',
          submittedForReviewAt: '2026-11-20T10:30:00Z',
          reviewerUserId: null,
          reviewNotes: null,
          rejectionReason: null,
          isPermanentRejection: false,
          reviewedAt: null,
          createdAt: '2026-11-20T10:30:00Z',
        },
      ],
      concurrencyVersion: 3,
    };

    it('27. normalizes authoritative backend wire format for newly submitted v1 application with zero past decisions', () => {
      const normalized = normalizeReviewDetail(rawAsterValleyPayload);

      // College presentation model mapping
      expect(normalized.college.collegeId).toBe(1);
      expect(normalized.college.id).toBe(1);
      expect(normalized.college.collegeCode).toBe('AVCAS-TEST-01');
      expect(normalized.college.legalName).toBe('Aster Valley College of Arts & Science');
      expect(normalized.college.concurrencyVersion).toBe(3);
      expect(normalized.college.versionNumber).toBe(1);

      // Admin user normalization
      expect(normalized.adminUser?.fullName).toBe('Aster Admin');
      expect(normalized.adminUser?.email).toBe('admin@astervalley.edu');
      expect(normalized.adminUser?.phone).toBe('+1-555-4321');
      expect(normalized.adminUser?.emailVerified).toBe(true);

      // Review history semantics: v1 unreviewed item has reviewedAt: null and status PENDING,
      // so reviewHistory (past decisions) MUST be empty
      expect(normalized.reviewHistory).toEqual([]);
      expect(normalized.revisionHistory).toHaveLength(1);
      expect(normalized.concurrencyVersion).toBe(3);
    });

    it('28. normalizes multi-revision history correctly extracting past completed decisions', () => {
      const rawMultiRevisionPayload: RawCollegeReviewDetailResponse = {
        ...rawAsterValleyPayload,
        college: {
          ...rawAsterValleyPayload.college,
          resubmissionCount: 1,
          actionRequiredCount: 1,
        },
        submittedRevision: {
          ...rawAsterValleyPayload.submittedRevision,
          versionNumber: 2,
        },
        revisionHistory: [
          {
            id: 10,
            versionNumber: 1,
            status: 'ACTION_REQUIRED',
            legalName: 'Aster Valley College of Arts & Science',
            submittedForReviewAt: '2026-11-20T10:30:00Z',
            reviewerUserId: 99,
            reviewNotes: 'Please provide valid affiliation certificate.',
            rejectionReason: null,
            isPermanentRejection: false,
            reviewedAt: '2026-11-21T09:00:00Z',
            createdAt: '2026-11-20T10:30:00Z',
          },
          {
            id: 15,
            versionNumber: 2,
            status: 'PENDING',
            legalName: 'Aster Valley College of Arts & Science',
            submittedForReviewAt: '2026-11-22T11:00:00Z',
            reviewerUserId: null,
            reviewNotes: null,
            rejectionReason: null,
            isPermanentRejection: false,
            reviewedAt: null,
            createdAt: '2026-11-22T11:00:00Z',
          },
        ],
        concurrencyVersion: 7,
      };

      const normalized = normalizeReviewDetail(rawMultiRevisionPayload);

      // Only the completed decision should be in reviewHistory
      expect(normalized.reviewHistory).toHaveLength(1);
      expect(normalized.reviewHistory[0].decision).toBe('REQUEST_ACTION');
      expect(normalized.reviewHistory[0].versionNumber).toBe(1);
      expect(normalized.reviewHistory[0].reviewNotes).toBe('Please provide valid affiliation certificate.');
      expect(normalized.reviewHistory[0].reviewerUserId).toBe(99);
      expect(normalized.reviewHistory[0].decisionByAdminEmail).toBeNull();
    });

    it('29. renders Review Detail page with real backend wire format without crashing', async () => {
      const normalized = normalizeReviewDetail(rawAsterValleyPayload);
      vi.spyOn(reviewService, 'getReviewDetail').mockResolvedValue(normalized);

      renderWithProviders(
        <MemoryRouter initialEntries={['/admin/colleges/reviews/1']}>
          <Routes>
            <Route
              path="/admin/colleges/reviews/:collegeId"
              element={<CollegeReviewDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Page header with institutional name and code
        expect(
          screen.getByRole('heading', {
            level: 1,
            name: /Aster Valley College of Arts & Science/i,
          })
        ).toBeInTheDocument();
        expect(screen.getByText('AVCAS-TEST-01')).toBeInTheDocument();

        // Concurrency version tag
        expect(screen.getByText('Version #3')).toBeInTheDocument();

        // Administrator details
        expect(screen.getByText('Aster Admin')).toBeInTheDocument();
        expect(screen.getByText('admin@astervalley.edu')).toBeInTheDocument();
        expect(screen.getByText('Email Verified')).toBeInTheDocument();

        // Institutional Profile
        expect(screen.getByText('100 Valley Road')).toBeInTheDocument();
        expect(screen.getByText('Valley State University')).toBeInTheDocument();

        // Revision History card: MUST NOT CRASH, renders (0) and empty state
        expect(screen.getByText('Review & Decision History (0)')).toBeInTheDocument();
        expect(
          screen.getByText('No prior review decisions recorded for this college.')
        ).toBeInTheDocument();

        // Documents card: renders (0) and empty state
        expect(screen.getByText('Active Verification Documents (0)')).toBeInTheDocument();
        expect(
          screen.getByText('No verification documents currently attached to this revision.')
        ).toBeInTheDocument();
      });
    });

    it('30. RevisionHistoryTimelineCard renders gracefully when reviewHistory is undefined or empty', () => {
      const { rerender } = renderWithProviders(
        <RevisionHistoryTimelineCard reviewHistory={undefined} />
      );
      expect(screen.getByText('Review & Decision History (0)')).toBeInTheDocument();
      expect(
        screen.getByText('No prior review decisions recorded for this college.')
      ).toBeInTheDocument();

      rerender(<RevisionHistoryTimelineCard reviewHistory={[]} />);
      expect(screen.getByText('Review & Decision History (0)')).toBeInTheDocument();
    });

    it('31. ReviewDocumentListCard renders gracefully when documents prop is undefined or empty', () => {
      const { rerender } = renderWithProviders(
        <ReviewDocumentListCard collegeId={1} documents={undefined} />
      );
      expect(screen.getByText('Active Verification Documents (0)')).toBeInTheDocument();
      expect(
        screen.getByText('No verification documents currently attached to this revision.')
      ).toBeInTheDocument();

      rerender(<ReviewDocumentListCard collegeId={1} documents={[]} />);
      expect(screen.getByText('Active Verification Documents (0)')).toBeInTheDocument();
    });

    it('32. ReviewAdminUserCard and CollegeProfileReviewCard render gracefully with null props', () => {
      const { rerender } = renderWithProviders(
        <ReviewAdminUserCard adminUser={null} />
      );
      expect(
        screen.getByText('No administrator credentials recorded for this institution.')
      ).toBeInTheDocument();

      rerender(<CollegeProfileReviewCard profile={null} />);
      expect(
        screen.getByText('No profile information submitted for this revision.')
      ).toBeInTheDocument();
    });

    it('33. reviewService.recordReviewDecision maps notes to reviewNotes for backend ReviewDecisionRequest contract', async () => {
      const apiSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            collegeId: 10,
            action: 'REQUEST_ACTION' as const,
            approvalStatus: 'ACTION_REQUIRED' as const,
            concurrencyVersion: 6,
            message: 'Action requested.',
          },
        },
      });

      const res = await reviewService.recordReviewDecision(10, {
        action: 'REQUEST_ACTION',
        expectedVersion: 5,
        notes: 'Fix affiliation certificate.',
        rejectionReason: null,
      });

      expect(res.approvalStatus).toBe('ACTION_REQUIRED');
      expect(apiSpy).toHaveBeenCalledWith(
        '/super-admin/colleges/reviews/10/decision',
        {
          action: 'REQUEST_ACTION',
          expectedVersion: 5,
          reviewNotes: 'Fix affiliation certificate.',
          rejectionReason: null,
        }
      );
    });
  });

  describe('Document Review Redesign & DocumentPreviewReviewModal Tests', () => {
    const mockPendingDoc: DocumentResponse = {
      id: 301,
      registrationId: 101,
      documentCategory: 'AUTHORIZED_SIGNATORY_ID',
      originalFilename: 'signatory_id.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 204800,
      sha256Checksum:
        '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      replacesDocumentId: null,
      createdAt: '2026-11-20T10:00:00Z',
      verificationStatus: 'PENDING',
      verificationProvenance: 'NOT_REVIEWED',
      rejectionReason: null,
      lastReviewedAt: null,
      lastReviewedByUserId: null,
      version: 2,
    };

    const mockAcceptedAffiliationDoc: DocumentResponse = {
      id: 302,
      registrationId: 101,
      documentCategory: 'UNIVERSITY_AFFILIATION_CERTIFICATE',
      originalFilename: 'affiliation_cert.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 512000,
      sha256Checksum:
        'aaaabbbbccccddddeeeeffff1111222233334444555566667777888899990000',
      replacesDocumentId: null,
      createdAt: '2026-11-20T10:05:00Z',
      verificationStatus: 'ACCEPTED',
      verificationProvenance: 'DIRECT_REVIEW',
      rejectionReason: null,
      lastReviewedAt: '2026-11-20T11:00:00Z',
      lastReviewedByUserId: 1,
      version: 1,
    };

    it('34. renders exactly one Review button per document row and no separate action buttons in table', () => {
      renderWithProviders(
        <ReviewDocumentListCard
          collegeId={10}
          documents={[mockPendingDoc, mockAcceptedAffiliationDoc]}
          collegeApprovalStatus="PENDING"
        />
      );

      // Exactly one Review button per document row
      const reviewButtons = screen.getAllByRole('button', { name: /^review/i });
      expect(reviewButtons).toHaveLength(2);

      // Separate action buttons must NOT exist in table rows
      expect(screen.queryByRole('button', { name: /^download$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^history$/i })).not.toBeInTheDocument();
    });

    it('35. renders verification status badge and completely removes Direct Review provenance badge from table rows', () => {
      renderWithProviders(
        <ReviewDocumentListCard
          collegeId={10}
          documents={[mockPendingDoc, mockAcceptedAffiliationDoc]}
          collegeApprovalStatus="PENDING"
        />
      );

      // Status badges are present
      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();

      // Direct Review provenance badge must be completely absent from table rows
      expect(screen.queryByText('Direct Review')).not.toBeInTheDocument();
    });

    it('36. clicking Review opens DocumentPreviewReviewModal and renders PDF stream inside iframe', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValueOnce({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      renderWithProviders(
        <ReviewDocumentListCard
          collegeId={10}
          documents={[mockPendingDoc]}
          collegeApprovalStatus="PENDING"
        />
      );

      const reviewBtn = screen.getByRole('button', {
        name: /review signatory_id\.pdf/i,
      });
      fireEvent.click(reviewBtn);

      await waitFor(() => {
        const iframe = screen.getByTitle(/preview of signatory_id\.pdf/i);
        expect(iframe).toBeInTheDocument();
        expect(iframe.tagName.toLowerCase()).toBe('iframe');
      });
    });

    it('37. renders image preview in DocumentPreviewReviewModal when stream returns image', async () => {
      const mockImageDoc: DocumentResponse = {
        ...mockPendingDoc,
        originalFilename: 'signatory_photo.jpg',
        mimeType: 'image/jpeg',
      };

      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValueOnce({
        blob: new Blob(['fake image binary'], { type: 'image/jpeg' }),
        contentType: 'image/jpeg',
      });

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockImageDoc}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText(/document signatory_photo\.jpg/i);
        expect(img).toBeInTheDocument();
        expect(img.tagName.toLowerCase()).toBe('img');
      });
    });

    it('38. displays unsupported format state and fallback download in modal for non-renderable MIME type', async () => {
      const mockZipDoc: DocumentResponse = {
        ...mockPendingDoc,
        originalFilename: 'supporting_archive.zip',
        mimeType: 'application/zip',
      };

      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValueOnce({
        blob: new Blob(['fake zip binary'], { type: 'application/zip' }),
        contentType: 'application/zip',
      });

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockZipDoc}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Format Not Renderable Inline')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download to view/i })).toBeInTheDocument();
      });
    });

    it('39. displays error state in DocumentPreviewReviewModal when document stream fails', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockRejectedValueOnce(
        new Error('Failed to load storage stream.')
      );

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockPendingDoc}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Failed to load storage stream.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download document file instead/i })).toBeInTheDocument();
      });
    });

    it('40. executes document download inside DocumentPreviewReviewModal', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValueOnce({
        blob: new Blob(['fake content'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const downloadSpy = vi
        .spyOn(reviewService, 'downloadReviewDocument')
        .mockResolvedValueOnce();

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockPendingDoc}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith(
          10,
          301,
          'signatory_id.pdf'
        );
      });
    });

    it('41. records ACCEPT decision inside DocumentPreviewReviewModal with expectedDocumentVersion bound strictly to document version', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValue({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const decisionSpy = vi
        .spyOn(reviewService, 'recordDocumentDecision')
        .mockResolvedValueOnce({
          documentId: 301,
          registrationId: 101,
          documentCategory: 'AUTHORIZED_SIGNATORY_ID',
          verificationStatus: 'ACCEPTED',
          verificationProvenance: 'DIRECT_REVIEW',
          rejectionReason: null,
          lastReviewedAt: '2026-11-26T12:00:00Z',
          lastReviewedByUserId: 1,
          version: 3,
        });

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockPendingDoc}
          collegeApprovalStatus="PENDING"
        />
      );

      const acceptBtn = await screen.findByRole('button', {
        name: /accept signatory_id\.pdf/i,
      });
      expect(acceptBtn).toBeEnabled();
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(decisionSpy).toHaveBeenCalledWith(10, 301, {
          action: 'ACCEPT',
          expectedDocumentVersion: 2,
        });
      });
    });

    it('42. treats document version 0 as authoritative and valid for ACCEPT inside DocumentPreviewReviewModal', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValue({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const docVersionZero: DocumentResponse = {
        ...mockPendingDoc,
        version: 0,
      };

      const decisionSpy = vi
        .spyOn(reviewService, 'recordDocumentDecision')
        .mockResolvedValueOnce({
          documentId: 301,
          registrationId: 101,
          documentCategory: 'AUTHORIZED_SIGNATORY_ID',
          verificationStatus: 'ACCEPTED',
          verificationProvenance: 'DIRECT_REVIEW',
          rejectionReason: null,
          lastReviewedAt: '2026-11-26T12:00:00Z',
          lastReviewedByUserId: 1,
          version: 1,
        });

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={docVersionZero}
          collegeApprovalStatus="PENDING"
        />
      );

      expect(screen.getByText('Version #0')).toBeInTheDocument();

      const acceptBtn = await screen.findByRole('button', {
        name: /accept signatory_id\.pdf/i,
      });
      expect(acceptBtn).toBeEnabled();
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(decisionSpy).toHaveBeenCalledWith(10, 301, {
          action: 'ACCEPT',
          expectedDocumentVersion: 0,
        });
      });
    });

    it('43. validates rejection reason length (10-2000 chars) and records REJECT decision inside DocumentPreviewReviewModal', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValue({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const decisionSpy = vi
        .spyOn(reviewService, 'recordDocumentDecision')
        .mockResolvedValueOnce({
          documentId: 301,
          registrationId: 101,
          documentCategory: 'AUTHORIZED_SIGNATORY_ID',
          verificationStatus: 'REJECTED',
          verificationProvenance: 'DIRECT_REVIEW',
          rejectionReason: 'The government ID is expired and illegible.',
          lastReviewedAt: '2026-11-26T12:00:00Z',
          lastReviewedByUserId: 1,
          version: 3,
        });

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockPendingDoc}
          collegeApprovalStatus="PENDING"
        />
      );

      const rejectBtn = await screen.findByRole('button', {
        name: /reject signatory_id\.pdf/i,
      });
      expect(rejectBtn).toBeEnabled();
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/document rejection reason \(required\)/i)
        ).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', {
        name: /confirm rejection/i,
      });

      // Submit without reason -> required validation error
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(
          screen.getByText(/Rejection reason must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
      expect(decisionSpy).not.toHaveBeenCalled();

      // Submit < 10 chars -> validation error
      const textarea = screen.getByPlaceholderText(/describe specific compliance issues/i);
      fireEvent.change(textarea, { target: { value: 'Bad photo' } });
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(
          screen.getByText(/Rejection reason must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
      expect(decisionSpy).not.toHaveBeenCalled();

      // Submit valid reason >= 10 chars
      fireEvent.change(textarea, {
        target: { value: 'The government ID is expired and illegible.' },
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(decisionSpy).toHaveBeenCalledWith(10, 301, {
          action: 'REJECT',
          expectedDocumentVersion: 2,
          rejectionReason: 'The government ID is expired and illegible.',
          notes: null,
        });
      });
    });

    it('44. handles 409 STALE_DOCUMENT_VERSION conflict in DocumentPreviewReviewModal and triggers conflict refresh', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValue({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const conflictError = new ApiError('Conflict', {
        status: 409,
        errorCode: 'STALE_DOCUMENT_VERSION',
      });

      vi.spyOn(reviewService, 'recordDocumentDecision').mockRejectedValueOnce(
        conflictError
      );

      const mockOnClose = vi.fn();
      const mockOnStaleConflict = vi.fn();

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={mockOnClose}
          collegeId={10}
          document={mockPendingDoc}
          onStaleConflict={mockOnStaleConflict}
        />
      );

      const rejectBtn = await screen.findByRole('button', {
        name: /reject signatory_id\.pdf/i,
      });
      fireEvent.click(rejectBtn);

      const textarea = screen.getByPlaceholderText(/describe specific compliance issues/i);
      fireEvent.change(textarea, {
        target: { value: 'Document version is outdated on server.' },
      });

      fireEvent.click(
        screen.getByRole('button', { name: /confirm rejection/i })
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnStaleConflict).toHaveBeenCalled();
      });
    });

    it('45. freezes document review decisions in DocumentPreviewReviewModal when college approval status is not PENDING, but preserves history access', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValue({
        blob: new Blob(['fake pdf binary'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const frozenStatuses: ('APPROVED' | 'REJECTED' | 'ACTION_REQUIRED')[] = [
        'APPROVED',
        'REJECTED',
        'ACTION_REQUIRED',
      ];

      for (const status of frozenStatuses) {
        const { unmount } = renderWithProviders(
          <DocumentPreviewReviewModal
            isOpen={true}
            onClose={vi.fn()}
            collegeId={10}
            document={mockPendingDoc}
            collegeApprovalStatus={status}
          />
        );

        // Accept and Reject buttons inside modal are disabled
        const acceptBtn = await screen.findByRole('button', {
          name: /accept signatory_id\.pdf/i,
        });
        expect(acceptBtn).toBeDisabled();
        expect(
          screen.getByRole('button', { name: /reject signatory_id\.pdf/i })
        ).toBeDisabled();

        // Download and History tabs remain available
        expect(screen.getByRole('button', { name: /^download$/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /^history$/i })).toBeEnabled();

        unmount();
      }
    });

    it('46. displays chronological decision history inside DocumentPreviewReviewModal history tab', async () => {
      vi.spyOn(reviewService, 'getDocumentPreviewBlob').mockResolvedValueOnce({
        blob: new Blob(['fake content'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
      });

      const mockHistory: DocumentReviewHistoryItemResponse[] = [
        {
          id: 701,
          documentId: 301,
          registrationId: 101,
          collegeId: 10,
          action: 'REJECTED',
          rejectionReason: 'Signature not matching passport records.',
          reviewerUserId: 1,
          reviewerEmail: 'owner@acadlytic.com',
          reviewedAt: '2026-11-26T15:00:00Z',
          createdAt: '2026-11-26T15:00:00Z',
        },
      ];

      vi.spyOn(reviewService, 'getDocumentReviewHistory').mockResolvedValueOnce(
        mockHistory
      );

      renderWithProviders(
        <DocumentPreviewReviewModal
          isOpen={true}
          onClose={vi.fn()}
          collegeId={10}
          document={mockPendingDoc}
        />
      );

      // Switch to History tab
      const historyTab = screen.getByRole('button', { name: /^history$/i });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Decision Audit Trail')).toBeInTheDocument();
        expect(screen.getByText('REJECTED')).toBeInTheDocument();
        expect(screen.getByText('Signature not matching passport records.')).toBeInTheDocument();
        expect(screen.getByText('owner@acadlytic.com')).toBeInTheDocument();
      });
    });
  });
});
