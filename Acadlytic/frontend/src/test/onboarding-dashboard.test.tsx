import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OnboardingStatusPage } from '@/pages/OnboardingStatusPage';
import { onboardingService } from '@/services/onboardingService';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './test-utils';
import {
  CollegeProfileResponse,
  CollegeSummaryResponse,
  CurrentRevisionResponse,
  DocumentResponse,
  MyApplicationResponse,
  OnboardingChecklistResponse,
  ResubmissionAllowanceResponse,
  ReviewFeedbackResponse,
  RevisionSummaryResponse,
} from '@/types';
import * as schemaModule from '@/schemas/onboardingSchema';
import { isDraftEditable, isApplicationFrozenInReview } from '@/hooks/useOnboarding';
import { CollegeApprovalGuard } from '@/routes/guards/CollegeApprovalGuard';

// --- Base Mock Data ---

const mockCollege: CollegeSummaryResponse = {
  id: 10,
  name: 'Horizon Institute of Technology',
  code: 'HIT-4421',
  approvalStatus: 'PENDING',
  status: 'PENDING_VERIFICATION',
};

const mockProfile: CollegeProfileResponse = {
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
};

const mockRevisionDraftV1: CurrentRevisionResponse = {
  id: 101,
  versionNumber: 1,
  status: 'PENDING',
  submittedForReviewAt: null,
  isDraft: true,
  profile: mockProfile,
};

const mockChecklistIncomplete: OnboardingChecklistResponse = {
  emailVerified: true,
  requiredDocumentsUploaded: false,
  canSubmitForReview: false,
  canStartCorrectionDraft: false,
  isFrozenInReview: false,
};

const mockResubmission: ResubmissionAllowanceResponse = {
  resubmissionCount: 0,
  actionRequiredCount: 0,
  maxRejections: 3,
  maxActionRequired: 10,
};

const mockFeedbackEmpty: ReviewFeedbackResponse = {
  reviewNotes: null,
  rejectionReason: null,
  isPermanentRejection: false,
  reviewedAt: null,
};

const mockDoc1: DocumentResponse = {
  id: 201,
  registrationId: 101,
  documentCategory: 'INSTITUTION_REGISTRATION_PROOF',
  originalFilename: 'registration_charter.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 2048000,
  sha256Checksum: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  replacesDocumentId: null,
  createdAt: '2026-11-20T10:00:00Z',
};

const mockDoc2: DocumentResponse = {
  id: 202,
  registrationId: 101,
  documentCategory: 'AUTHORIZED_SIGNATORY_ID',
  originalFilename: 'signatory_passport.jpg',
  mimeType: 'image/jpeg',
  fileSizeBytes: 1048576,
  sha256Checksum: '123456abcdef7890abcdef1234567890abcdef1234567890abcdef1234567890',
  replacesDocumentId: null,
  createdAt: '2026-11-20T10:15:00Z',
};

const mockDoc3Replacing: DocumentResponse = {
  id: 203,
  registrationId: 101,
  documentCategory: 'UNIVERSITY_AFFILIATION_CERTIFICATE',
  originalFilename: 'affiliation_2026.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1536000,
  sha256Checksum: '7890abcdef123456abcdef1234567890abcdef1234567890abcdef1234567890',
  replacesDocumentId: 199,
  createdAt: '2026-11-20T10:30:00Z',
};

const baseApplication: MyApplicationResponse = {
  college: mockCollege,
  currentRevision: mockRevisionDraftV1,
  reviewFeedback: mockFeedbackEmpty,
  resubmission: mockResubmission,
  checklist: mockChecklistIncomplete,
  activeDocuments: [mockDoc1, mockDoc2],
  revisionHistory: [],
};

describe('Module 3.3 — College Admin Restricted Dashboard (Frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();

    // Default logged in unapproved COLLEGE_ADMIN
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 42,
        email: 'admin@horizon.edu',
        firstName: 'John',
        lastName: 'Doe',
        role: 'COLLEGE_ADMIN',
        collegeId: 10,
        collegeCode: 'HIT-4421',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: true,
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // =========================================================================
  // 1. DASHBOARD INITIAL RENDERING & STATE PRESENTATION
  // =========================================================================

  it('1. renders draft application v1 with college summary, code, and editing open', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading institutional onboarding application/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Horizon Institute of Technology')[0]).toBeInTheDocument();
      expect(screen.getAllByText('HIT-4421')[0]).toBeInTheDocument();
      expect(screen.getByText(/Revision v1/)).toBeInTheDocument();
      expect(screen.getByText(/Draft — Pending Submission/i)).toBeInTheDocument();
      expect(screen.getByText('2 / 5 Active')).toBeInTheDocument();
    });
  });

  it('2. redirects approved COLLEGE_ADMIN to /college/dashboard immediately', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 42,
        email: 'approved@horizon.edu',
        firstName: 'Approved',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 10,
        collegeCode: 'HIT-4421',
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'ACTIVE',
        managementUnlocked: true,
        emailVerified: true,
      },
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          <Route path="/college/dashboard" element={<div>College Dashboard Main</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('College Dashboard Main')).toBeInTheDocument();
  });

  it('3. renders frozen-in-review state with locked banner and disabled actions', async () => {
    const frozenApp: MyApplicationResponse = {
      ...baseApplication,
      currentRevision: {
        ...mockRevisionDraftV1,
        isDraft: false,
        status: 'PENDING',
        submittedForReviewAt: '2026-11-21T08:00:00Z',
      },
      checklist: {
        ...mockChecklistIncomplete,
        isFrozenInReview: true,
        canSubmitForReview: false,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(frozenApp);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Under Review — Application Frozen/i)).toBeInTheDocument();
      expect(screen.getByText(/Application Locked for Review/i)).toBeInTheDocument();
    });

    // Edit Profile button should be absent or hidden
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();

    // Upload button disabled
    const uploadBtn = screen.getByRole('button', { name: /upload document/i });
    expect(uploadBtn).toBeDisabled();
  });

  it('4. renders ACTION_REQUIRED status with reviewer feedback card and Start Correction button', async () => {
    const actionRequiredApp: MyApplicationResponse = {
      ...baseApplication,
      currentRevision: {
        ...mockRevisionDraftV1,
        isDraft: false,
        status: 'ACTION_REQUIRED',
        submittedForReviewAt: '2026-11-20T10:00:00Z',
      },
      reviewFeedback: {
        reviewNotes: 'Please upload an updated accreditation certificate signed within the current academic year.',
        rejectionReason: null,
        isPermanentRejection: false,
        reviewedAt: '2026-11-22T14:30:00Z',
      },
      resubmission: {
        ...mockResubmission,
        actionRequiredCount: 1,
      },
      checklist: {
        ...mockChecklistIncomplete,
        canStartCorrectionDraft: true,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(actionRequiredApp);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Action Required — Corrections Needed/i)).toBeInTheDocument();
      expect(screen.getByText(/Super Admin Feedback: Action Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please upload an updated accreditation certificate/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start correction draft/i })).toBeInTheDocument();
    });
  });

  it('5. renders REJECTED status with rejection reason and resubmission counters', async () => {
    const rejectedApp: MyApplicationResponse = {
      ...baseApplication,
      currentRevision: {
        ...mockRevisionDraftV1,
        isDraft: false,
        status: 'REJECTED',
        submittedForReviewAt: '2026-11-20T10:00:00Z',
      },
      reviewFeedback: {
        reviewNotes: 'Tax documentation could not be verified with registry records.',
        rejectionReason: 'Invalid Institutional Documentation',
        isPermanentRejection: false,
        reviewedAt: '2026-11-22T15:00:00Z',
      },
      resubmission: {
        ...mockResubmission,
        resubmissionCount: 1,
      },
      checklist: {
        ...mockChecklistIncomplete,
        canStartCorrectionDraft: true,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(rejectedApp);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Application Rejected/i)).toBeInTheDocument();
      expect(screen.getByText(/Super Admin Review Decision: Rejected/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid Institutional Documentation/i)).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start correction draft/i })).toBeInTheDocument();
    });
  });

  it('6. renders permanent rejection screen on HTTP 403 REGISTRATION_PERMANENTLY_REJECTED', async () => {
    const permRejectError = new ApiError('College registration permanently rejected', {
      status: 403,
      errorCode: 'REGISTRATION_PERMANENTLY_REJECTED',
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockRejectedValueOnce(permRejectError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registration Application Permanently Rejected/i)).toBeInTheDocument();
      expect(screen.getByText(/No further correction revisions may be created/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. CHECKLIST PROGRESS & MILESTONES
  // =========================================================================

  it('7. displays Step 1 unverified email alert and ResendVerificationButton if user email is unverified', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 42,
        email: 'unverified@horizon.edu',
        firstName: 'Unverified',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 10,
        collegeCode: 'HIT-4421',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
    });

    const unverifiedApp: MyApplicationResponse = {
      ...baseApplication,
      checklist: {
        ...mockChecklistIncomplete,
        emailVerified: false,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(unverifiedApp);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Step 1: Administrator Email Verification/i)).toBeInTheDocument();
      expect(screen.getByText(/Verify your email address using the link sent upon registration/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /resend verification email/i })[0]).toBeInTheDocument();
    });
  });

  it('8. unlocks review submission button when all 4 checklist steps are satisfied', async () => {
    const readyApp: MyApplicationResponse = {
      ...baseApplication,
      checklist: {
        emailVerified: true,
        requiredDocumentsUploaded: true,
        canSubmitForReview: true,
        canStartCorrectionDraft: false,
        isFrozenInReview: false,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(readyApp);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/All prerequisites satisfied! You can now submit your application/i)).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /submit application/i });
      expect(submitBtn).toBeEnabled();
    });
  });

  // =========================================================================
  // 3. PROFILE DISPLAY AND MODAL EDITING
  // =========================================================================

  it('9. displays complete profile fields and permanent immutable college code', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('123 Education Lane, Suite 400, Metropolis, NY 10001, United States')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0199')).toBeInTheDocument();
      expect(screen.getByText('State Technical University')).toBeInTheDocument();
      expect(screen.getByText('https://horizon.edu')).toBeInTheDocument();
    });
  });

  it('10. opens EditProfileModal pre-filled with profile data and code disabled', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit profile/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit profile/i })[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/College Code/i)).toBeDisabled();
    expect(screen.getByLabelText(/Legal Institution Name/i)).toHaveValue('Horizon Institute of Technology');
  });

  it('11. submits profile edits and updates query cache without optimistic tenant sync', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    const updateSpy = vi.spyOn(onboardingService, 'updateDraftProfile').mockResolvedValueOnce({
      ...mockRevisionDraftV1,
      profile: {
        ...mockProfile,
        legalName: 'Horizon University of Technology',
      },
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit profile/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit profile/i })[0]);

    const legalNameInput = screen.getByLabelText(/Legal Institution Name/i);
    fireEvent.change(legalNameInput, { target: { value: 'Horizon University of Technology' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          legalName: 'Horizon University of Technology',
        })
      );
    });
  });

  it('12. displays server validation errors in EditProfileModal on PUT failure', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    const validationError = new ApiError('Validation failed', {
      status: 400,
      errors: {
        legalName: 'Legal name contains disallowed characters.',
      },
    });

    vi.spyOn(onboardingService, 'updateDraftProfile').mockRejectedValueOnce(validationError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit profile/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit profile/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Legal name contains disallowed characters.')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. DOCUMENT MANAGEMENT & LINEAGE
  // =========================================================================

  it('13. renders active documents table with category badges, sizes, and lineage info', async () => {
    const appWithReplacingDoc: MyApplicationResponse = {
      ...baseApplication,
      activeDocuments: [mockDoc1, mockDoc2, mockDoc3Replacing],
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(appWithReplacingDoc);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('registration_charter.pdf')).toBeInTheDocument();
      expect(screen.getByText('signatory_passport.jpg')).toBeInTheDocument();
      expect(screen.getByText('affiliation_2026.pdf')).toBeInTheDocument();
      expect(screen.getByText(/Replaces doc #199/i)).toBeInTheDocument();
      expect(screen.getByText('2 MB')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
    });
  });

  it('14. disables Upload Document button when active document limit (5) is reached', async () => {
    const docsLimit5: DocumentResponse[] = [
      mockDoc1,
      mockDoc2,
      mockDoc3Replacing,
      { ...mockDoc1, id: 204, originalFilename: 'doc4.pdf' },
      { ...mockDoc1, id: 205, originalFilename: 'doc5.pdf' },
    ];

    const appLimit5: MyApplicationResponse = {
      ...baseApplication,
      activeDocuments: docsLimit5,
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(appLimit5);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5 / 5 Active')).toBeInTheDocument();
      expect(screen.getByText(/maximum allowed limit of 5 active documents/i)).toBeInTheDocument();
      const uploadBtn = screen.getByRole('button', { name: /upload document/i });
      expect(uploadBtn).toBeDisabled();
    });
  });

  it('15. triggers document download via onboardingService.downloadDocument', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    const downloadSpy = vi.spyOn(onboardingService, 'downloadDocument').mockResolvedValueOnce();

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('registration_charter.pdf')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByTitle('Download document');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(201, 'registration_charter.pdf');
    });
  });

  it('16. prompts confirmation and deletes document with predecessor restoration notice', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    const deleteSpy = vi.spyOn(onboardingService, 'deleteDocument').mockResolvedValueOnce();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('registration_charter.pdf')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete document');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('predecessor will be restored'));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(201);
    });
  });

  it('17. cancels document deletion if confirmation is declined', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    const deleteSpy = vi.spyOn(onboardingService, 'deleteDocument');
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('registration_charter.pdf')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete document');
    fireEvent.click(deleteButtons[0]);

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 5. DOCUMENT UPLOAD & VALIDATION MODAL
  // =========================================================================

  it('18. opens DocumentUploadModal and validates file selection', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /upload document/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Upload Verification Document/i)).toBeInTheDocument();
  });

  it('19. rejects files exceeding 10MB in upload modal with client validation error', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }));
    });

    const oversizedFile = new File(['x'.repeat(100)], 'huge_document.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File exceeds maximum allowed size of 10 MB/i)).toBeInTheDocument();
    });
  });

  it('20. rejects files with invalid extension in upload modal', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }));
    });

    const invalidExtFile = new File(['test'], 'archive.zip', {
      type: 'application/zip',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [invalidExtFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file extension "\.zip"/i)).toBeInTheDocument();
    });
  });

  it('21. rejects files failing binary magic byte probe before making API call', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    vi.spyOn(schemaModule, 'probeFileMagicBytes').mockResolvedValueOnce(false);
    const uploadSpy = vi.spyOn(onboardingService, 'uploadDocument');

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }));
    });

    const fakePdf = new File(['fake content'], 'spoofed.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [fakePdf] } });

    const submitBtn = within(screen.getByRole('dialog')).getByRole('button', {
      name: /upload document/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/File binary header is invalid or corrupted/i)).toBeInTheDocument();
      expect(uploadSpy).not.toHaveBeenCalled();
    });
  });

  it('22. successfully uploads valid document and closes modal', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    vi.spyOn(schemaModule, 'probeFileMagicBytes').mockResolvedValueOnce(true);
    const uploadSpy = vi.spyOn(onboardingService, 'uploadDocument').mockResolvedValueOnce({
      id: 206,
      registrationId: 101,
      documentCategory: 'INSTITUTION_REGISTRATION_PROOF',
      originalFilename: 'valid.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 50000,
      sha256Checksum: 'validhash',
      replacesDocumentId: null,
      createdAt: '2026-11-22T10:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }));
    });

    const validPdf = new File(['%PDF-1.4 header'], 'valid.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    const submitBtn = within(screen.getByRole('dialog')).getByRole('button', {
      name: /upload document/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        validPdf,
        'INSTITUTION_REGISTRATION_PROOF',
        undefined
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('23. opens upload modal in replace mode with pre-filled category and replacesDocumentId', async () => {
    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(baseApplication);
    vi.spyOn(schemaModule, 'probeFileMagicBytes').mockResolvedValueOnce(true);
    const uploadSpy = vi.spyOn(onboardingService, 'uploadDocument').mockResolvedValueOnce({
      ...mockDoc1,
      id: 207,
      replacesDocumentId: 201,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('registration_charter.pdf')).toBeInTheDocument();
    });

    const replaceButtons = screen.getAllByTitle('Replace document with an updated version');
    fireEvent.click(replaceButtons[0]);

    expect(screen.getByText(/Replace Document: registration_charter\.pdf/i)).toBeInTheDocument();

    const validPdf = new File(['%PDF-1.4 header'], 'new_charter.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /replace document/i,
      })
    );

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        validPdf,
        'INSTITUTION_REGISTRATION_PROOF',
        201
      );
    });
  });

  // =========================================================================
  // 6. REVIEW SUBMISSION WORKFLOW & FREEZE
  // =========================================================================

  it('24. opens SubmitApplicationModal and emphasizes application freeze upon confirmation', async () => {
    const readyApp: MyApplicationResponse = {
      ...baseApplication,
      checklist: {
        emailVerified: true,
        requiredDocumentsUploaded: true,
        canSubmitForReview: true,
        canStartCorrectionDraft: false,
        isFrozenInReview: false,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(readyApp);
    const submitSpy = vi.spyOn(onboardingService, 'submitApplication').mockResolvedValueOnce({
      registrationId: 10,
      versionNumber: 1,
      status: 'PENDING',
      submittedForReviewAt: '2026-11-23T10:00:00Z',
      message: 'Application submitted for review.',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit application/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Submit Application for Review \(v1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Irrevocable Submission & Review Lock/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm & submit/i }));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 7. CORRECTION DRAFT CREATION
  // =========================================================================

  it('25. creates correction draft from ACTION_REQUIRED state and updates revision', async () => {
    const actionRequiredApp: MyApplicationResponse = {
      ...baseApplication,
      currentRevision: {
        ...mockRevisionDraftV1,
        isDraft: false,
        status: 'ACTION_REQUIRED',
        submittedForReviewAt: '2026-11-20T10:00:00Z',
      },
      checklist: {
        ...mockChecklistIncomplete,
        canStartCorrectionDraft: true,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(actionRequiredApp);
    const draftSpy = vi.spyOn(onboardingService, 'createCorrectionDraft').mockResolvedValueOnce({
      id: 102,
      versionNumber: 2,
      status: 'PENDING',
      submittedForReviewAt: null,
      isDraft: true,
      profile: mockProfile,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start correction draft/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /start correction draft/i }));

    await waitFor(() => {
      expect(draftSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 8. REVISION HISTORY DRAWER
  // =========================================================================

  it('26. opens RevisionHistoryDrawer and displays past submitted revisions audit trail', async () => {
    const historyHistory: RevisionSummaryResponse[] = [
      {
        id: 99,
        versionNumber: 1,
        status: 'ACTION_REQUIRED',
        submittedForReviewAt: '2026-11-18T10:00:00Z',
        reviewedAt: '2026-11-19T14:00:00Z',
        isPermanentRejection: false,
      },
    ];

    const appWithHistory: MyApplicationResponse = {
      ...baseApplication,
      revisionHistory: historyHistory,
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(appWithHistory);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /revision history \(1\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /revision history \(1\)/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Application Revision History')).toBeInTheDocument();
    expect(screen.getByText('Revision v1')).toBeInTheDocument();
  });

  // =========================================================================
  // 9. PHASE 03 E2E REGRESSION SUITE: WIRE-FORMAT JACKSON SERIALIZATION & STATE DERIVATION
  // =========================================================================

  describe('Phase 03 E2E Regression: Wire-Format Jackson Serialization & Lifecycle Invariants', () => {
    // 1. submittedForReviewAt omitted and isDraft: true → editable draft
    it('27. evaluates draft as editable when submittedForReviewAt is omitted (Jackson NON_NULL wire format)', () => {
      const wireFormatDraft: CurrentRevisionResponse = {
        id: 1,
        versionNumber: 1,
        status: 'PENDING',
        isDraft: true,
        // submittedForReviewAt omitted entirely
        profile: mockProfile,
      };
      expect(isDraftEditable(wireFormatDraft)).toBe(true);
    });

    // 2. Explicit submittedForReviewAt: null and isDraft: true → editable draft
    it('28. evaluates draft as editable when submittedForReviewAt is explicitly null', () => {
      const explicitNullDraft: CurrentRevisionResponse = {
        id: 1,
        versionNumber: 1,
        status: 'PENDING',
        isDraft: true,
        submittedForReviewAt: null,
        profile: mockProfile,
      };
      expect(isDraftEditable(explicitNullDraft)).toBe(true);
    });

    // 3. Non-null submission timestamp → not editable
    it('29. evaluates draft as NOT editable when a real submission timestamp exists', () => {
      const submittedDraft: CurrentRevisionResponse = {
        id: 1,
        versionNumber: 1,
        status: 'PENDING',
        isDraft: true,
        submittedForReviewAt: '2026-11-25T14:30:00Z',
        profile: mockProfile,
      };
      expect(isDraftEditable(submittedDraft)).toBe(false);
    });

    // 4. isDraft: false → not editable
    it('30. evaluates revision as NOT editable when isDraft is false', () => {
      const nonDraftRevision: CurrentRevisionResponse = {
        id: 1,
        versionNumber: 1,
        status: 'PENDING',
        isDraft: false,
        submittedForReviewAt: null,
        profile: mockProfile,
      };
      expect(isDraftEditable(nonDraftRevision)).toBe(false);
      expect(isDraftEditable(null)).toBe(false);
      expect(isDraftEditable(undefined)).toBe(false);
    });

    // 5. Initial draft + verified email + available quota → upload button enabled
    // 6. Initial draft + unverified email → upload button disabled
    // 7. Initial draft + zero documents → Step 3 incomplete and Step 4 incomplete
    // 8. Initial draft → banner does not show Under Review/Frozen
    it('31. renders initial draft with omitted timestamp: banner is Draft, upload is enabled, Step 4 is incomplete', async () => {
      // Exact observed live backend response fixture (submittedForReviewAt omitted, 0 documents)
      const initialDraftWireResponse: MyApplicationResponse = {
        college: {
          id: 1,
          name: 'Aster Valley College of Arts & Science',
          code: 'AVCAS-TEST-001',
          approvalStatus: 'PENDING',
          status: 'PENDING_VERIFICATION',
        },
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'PENDING',
          isDraft: true,
          // submittedForReviewAt omitted by Jackson
          profile: mockProfile,
        },
        resubmission: {
          resubmissionCount: 0,
          actionRequiredCount: 0,
          maxRejections: 3,
          maxActionRequired: 10,
        },
        checklist: {
          emailVerified: true,
          requiredDocumentsUploaded: false,
          canSubmitForReview: false,
          canStartCorrectionDraft: false,
          isFrozenInReview: false,
        },
        activeDocuments: [],
        revisionHistory: [],
        reviewFeedback: mockFeedbackEmpty,
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(initialDraftWireResponse);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Banner checks (Requirement 8)
        expect(screen.getByText('Draft — Pending Submission')).toBeInTheDocument();
        expect(screen.queryByText(/under review/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/application frozen/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Revision v1 \(Draft\)/)).toBeInTheDocument();

        // Document Upload check (Requirement 5): 0/5 active documents, upload button enabled
        expect(screen.getByText('0 / 5 Active')).toBeInTheDocument();
        const uploadBtn = screen.getByRole('button', { name: /upload document/i });
        expect(uploadBtn).toBeEnabled();

        // Checklist checks (Requirement 7): Step 3 incomplete, Step 4 incomplete
        expect(screen.getByText('Step 3: Mandatory Verification Documents')).toBeInTheDocument();
        expect(screen.getByText('Step 4: Submit Application for Super Admin Review')).toBeInTheDocument();
        expect(screen.getByText('Complete Steps 1-3 to unlock review submission.')).toBeInTheDocument();
        // Progress should show 2 of 4 completed (Email Verified + Profile Complete)
        expect(screen.getByText(/2 of 4 completed/i)).toBeInTheDocument();
      });
    });

    it('32. disables upload action with tooltip when email is unverified on initial draft', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 42,
          email: 'admin@horizon.edu',
          firstName: 'John',
          lastName: 'Doe',
          role: 'COLLEGE_ADMIN',
          collegeId: 10,
          collegeCode: 'HIT-4421',
          collegeApprovalStatus: 'PENDING',
          managementUnlocked: false,
          emailVerified: false,
        },
      });

      const unverifiedDraftApp: MyApplicationResponse = {
        college: mockCollege,
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'PENDING',
          isDraft: true,
          profile: mockProfile,
        },
        resubmission: mockResubmission,
        checklist: {
          emailVerified: false,
          requiredDocumentsUploaded: false,
          canSubmitForReview: false,
          canStartCorrectionDraft: false,
          isFrozenInReview: false,
        },
        activeDocuments: [],
        revisionHistory: [],
        reviewFeedback: mockFeedbackEmpty,
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(unverifiedDraftApp);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const uploadBtn = screen.getByRole('button', { name: /upload document/i });
        expect(uploadBtn).toBeDisabled();
        expect(uploadBtn).toHaveAttribute(
          'title',
          'Email verification required before uploading documents'
        );
      });
    });

    // 9. Actually frozen review → banner shows the correct frozen state and upload is disabled
    it('33. presents Under Review — Application Frozen and disables upload when revision is frozen', async () => {
      const frozenApp: MyApplicationResponse = {
        college: mockCollege,
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'PENDING',
          isDraft: false,
          submittedForReviewAt: '2026-11-25T12:00:00Z',
          profile: mockProfile,
        },
        resubmission: mockResubmission,
        checklist: {
          emailVerified: true,
          requiredDocumentsUploaded: true,
          canSubmitForReview: false,
          canStartCorrectionDraft: false,
          isFrozenInReview: true,
        },
        activeDocuments: [mockDoc1, mockDoc2],
        revisionHistory: [],
        reviewFeedback: mockFeedbackEmpty,
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(frozenApp);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Under Review — Application Frozen')).toBeInTheDocument();
        expect(screen.getByText('Revision v1')).toBeInTheDocument();
        expect(screen.queryByText(/Revision v1 \(Draft\)/)).not.toBeInTheDocument();

        const uploadBtn = screen.getByRole('button', { name: /upload document/i });
        expect(uploadBtn).toBeDisabled();
        expect(uploadBtn).toHaveAttribute(
          'title',
          'Document modifications locked while application is under review'
        );

        // Step 4 is complete with submitted message
        expect(
          screen.getByText('Application revision submitted and currently under review.')
        ).toBeInTheDocument();
        expect(screen.getByText(/4 of 4 completed/i)).toBeInTheDocument();
      });
    });

    // 10. ACTION_REQUIRED → existing correction lifecycle works correctly
    it('34. displays Action Required banner and correction guidance when corrections requested', async () => {
      const actionReqApp: MyApplicationResponse = {
        college: mockCollege,
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'ACTION_REQUIRED',
          isDraft: false,
          submittedForReviewAt: '2026-11-24T10:00:00Z',
          profile: mockProfile,
        },
        resubmission: mockResubmission,
        checklist: {
          emailVerified: true,
          requiredDocumentsUploaded: true,
          canSubmitForReview: false,
          canStartCorrectionDraft: true,
          isFrozenInReview: false,
        },
        activeDocuments: [mockDoc1, mockDoc2],
        revisionHistory: [],
        reviewFeedback: {
          reviewNotes: 'Please provide higher resolution signatory ID.',
          rejectionReason: null,
          isPermanentRejection: false,
          reviewedAt: '2026-11-25T09:00:00Z',
        },
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(actionReqApp);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Action Required — Corrections Needed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start correction draft/i })).toBeInTheDocument();
        expect(
          screen.getByText(/Super Admin requested corrections\. Create a correction draft to proceed\./i)
        ).toBeInTheDocument();
      });
    });

    // 11. APPROVED and REJECTED states retain their existing correct representations
    it('35. displays Application Rejected presentation when status is REJECTED', async () => {
      const rejectedApp: MyApplicationResponse = {
        college: mockCollege,
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'REJECTED',
          isDraft: false,
          submittedForReviewAt: '2026-11-24T10:00:00Z',
          profile: mockProfile,
        },
        resubmission: {
          resubmissionCount: 1,
          actionRequiredCount: 0,
          maxRejections: 3,
          maxActionRequired: 10,
        },
        checklist: {
          emailVerified: true,
          requiredDocumentsUploaded: true,
          canSubmitForReview: false,
          canStartCorrectionDraft: true,
          isFrozenInReview: false,
        },
        activeDocuments: [mockDoc1, mockDoc2],
        revisionHistory: [],
        reviewFeedback: {
          reviewNotes: null,
          rejectionReason: 'Invalid institutional affiliation.',
          isPermanentRejection: false,
          reviewedAt: '2026-11-25T09:00:00Z',
        },
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(rejectedApp);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Application Rejected')).toBeInTheDocument();
        expect(screen.getByText('Revision rejected by Super Admin. Start a correction draft to resubmit.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start correction draft/i })).toBeInTheDocument();
      });
    });

    it('36. displays Application Approved presentation when status is APPROVED', async () => {
      const approvedApp: MyApplicationResponse = {
        college: {
          ...mockCollege,
          approvalStatus: 'APPROVED',
          status: 'PENDING_VERIFICATION', // not yet active in system
        },
        currentRevision: {
          id: 1,
          versionNumber: 1,
          status: 'APPROVED',
          isDraft: false,
          submittedForReviewAt: '2026-11-24T10:00:00Z',
          profile: mockProfile,
        },
        resubmission: mockResubmission,
        checklist: {
          emailVerified: true,
          requiredDocumentsUploaded: true,
          canSubmitForReview: false,
          canStartCorrectionDraft: false,
          isFrozenInReview: false,
        },
        activeDocuments: [mockDoc1, mockDoc2],
        revisionHistory: [],
        reviewFeedback: {
          reviewNotes: 'All credentials verified successfully.',
          rejectionReason: null,
          isPermanentRejection: false,
          reviewedAt: '2026-11-25T09:00:00Z',
        },
      };

      vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(approvedApp);

      renderWithProviders(
        <MemoryRouter initialEntries={['/onboarding-status']}>
          <Routes>
            <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Application Approved')).toBeInTheDocument();
        expect(screen.getByText('Application approved by Super Admin.')).toBeInTheDocument();
      });
    });

    // 12. College Dashboard approval guard continues redirecting pending colleges to /onboarding-status
    it('37. CollegeApprovalGuard continues redirecting PENDING college admin to /onboarding-status', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 101,
          email: 'pending@institution.edu',
          firstName: 'Pending',
          lastName: 'Admin',
          role: 'COLLEGE_ADMIN',
          collegeId: 1,
          collegeCode: 'AVCAS-TEST-001',
          collegeApprovalStatus: 'PENDING',
          collegeStatus: 'PENDING_VERIFICATION',
          managementUnlocked: false,
          emailVerified: true,
        },
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/college/dashboard']}>
          <Routes>
            <Route path="/onboarding-status" element={<div>Onboarding Status Gate</div>} />
            <Route element={<CollegeApprovalGuard />}>
              <Route path="/college/dashboard" element={<div>Restricted College Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Onboarding Status Gate')).toBeInTheDocument();
      expect(screen.queryByText('Restricted College Dashboard')).not.toBeInTheDocument();
    });

    it('38. isApplicationFrozenInReview prioritizes checklist.isFrozenInReview authoritatively', () => {
      // When checklist explicitly says not frozen, it must be false even if status is PENDING
      const revisionWithTimestamp: CurrentRevisionResponse = {
        id: 1,
        versionNumber: 1,
        status: 'PENDING',
        isDraft: false,
        submittedForReviewAt: '2026-11-25T10:00:00Z',
        profile: mockProfile,
      };

      const unfrozenChecklist: OnboardingChecklistResponse = {
        emailVerified: true,
        requiredDocumentsUploaded: true,
        canSubmitForReview: false,
        canStartCorrectionDraft: false,
        isFrozenInReview: false,
      };

      expect(isApplicationFrozenInReview(revisionWithTimestamp, unfrozenChecklist)).toBe(false);

      const frozenChecklist: OnboardingChecklistResponse = {
        ...unfrozenChecklist,
        isFrozenInReview: true,
      };

      expect(isApplicationFrozenInReview(revisionWithTimestamp, frozenChecklist)).toBe(true);
    });
  });
});
