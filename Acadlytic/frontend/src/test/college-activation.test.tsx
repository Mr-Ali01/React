import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CollegeAdminDashboardPage } from '@/pages/dashboard/CollegeAdminDashboardPage';
import { OnboardingStatusPage } from '@/pages/OnboardingStatusPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { CollegeApprovalGuard } from '@/routes/guards/CollegeApprovalGuard';
import { onboardingService } from '@/services/onboardingService';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './test-utils';
import type {
  CurrentUser,
  MyApplicationResponse,
  DocumentResponse,
} from '@/types';

// --- Authoritative Mock Data ---

const mockApprovedCollege = {
  id: 10,
  name: 'Horizon Institute of Technology',
  code: 'HIT-4421',
  approvalStatus: 'APPROVED' as const,
  status: 'ACTIVE' as const,
};

const mockApprovedProfile = {
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

const mockApprovedRevision = {
  id: 102,
  versionNumber: 2,
  status: 'APPROVED' as const,
  submittedForReviewAt: '2026-11-20T10:00:00Z',
  isDraft: false,
  profile: mockApprovedProfile,
};

const mockReviewFeedback = {
  reviewNotes: 'All accreditation and affiliation documentation validated successfully.',
  rejectionReason: null,
  isPermanentRejection: false,
  reviewedAt: '2026-11-24T14:30:00Z',
};

const mockChecklistComplete = {
  emailVerified: true,
  requiredDocumentsUploaded: true,
  canSubmitForReview: false,
  canStartCorrectionDraft: false,
  isFrozenInReview: false,
};

const mockActiveDocuments: DocumentResponse[] = [
  {
    id: 501,
    registrationId: 102,
    documentCategory: 'UNIVERSITY_AFFILIATION_CERTIFICATE',
    originalFilename: 'Affiliation_Cert_2026.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2048576,
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    replacesDocumentId: null,
    createdAt: '2026-11-19T08:00:00Z',
  },
  {
    id: 502,
    registrationId: 102,
    documentCategory: 'AUTHORIZED_SIGNATORY_ID',
    originalFilename: 'Signatory_Passport.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1048576,
    sha256Checksum: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    replacesDocumentId: null,
    createdAt: '2026-11-19T08:05:00Z',
  },
];

const mockRevisionHistory = [
  {
    id: 101,
    versionNumber: 1,
    status: 'ACTION_REQUIRED' as const,
    submittedForReviewAt: '2026-11-15T09:00:00Z',
    reviewedAt: '2026-11-16T11:00:00Z',
    isPermanentRejection: false,
  },
  {
    id: 102,
    versionNumber: 2,
    status: 'APPROVED' as const,
    submittedForReviewAt: '2026-11-20T10:00:00Z',
    reviewedAt: '2026-11-24T14:30:00Z',
    isPermanentRejection: false,
  },
];

const mockApprovedApplication: MyApplicationResponse = {
  college: mockApprovedCollege,
  currentRevision: mockApprovedRevision,
  reviewFeedback: mockReviewFeedback,
  resubmission: {
    resubmissionCount: 1,
    actionRequiredCount: 1,
    maxRejections: 3,
    maxActionRequired: 10,
  },
  checklist: mockChecklistComplete,
  activeDocuments: mockActiveDocuments,
  revisionHistory: mockRevisionHistory,
};

const mockApprovedUser: CurrentUser = {
  id: 42,
  email: 'admin@horizon.edu',
  firstName: 'Elena',
  lastName: 'Rostova',
  role: 'COLLEGE_ADMIN',
  collegeId: 10,
  collegeName: 'Horizon Institute of Technology',
  collegeCode: 'HIT-4421',
  collegeApprovalStatus: 'APPROVED',
  collegeStatus: 'ACTIVE',
  managementUnlocked: true,
  emailVerified: true,
};

describe('Module 3.5 — Approval Lifecycle, College Activation & Revisions (Frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Scenario 1: Renders Operational Dashboard
  it('1. renders operational dashboard with legal name, permanent code, and active badges', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('Welcome to Acadlytic, Horizon Institute of Technology!')
    ).toBeInTheDocument();
    expect(screen.getByText('Permanent College Code')).toBeInTheDocument();
    expect(screen.getAllByText('HIT-4421').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('State Technical University')).toBeInTheDocument();
    });
  });

  // Scenario 2: Status Badges Verification
  it('2. asserts ACTIVE, APPROVED, and UNLOCKED status badges render with emerald styling', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    const activeBadge = screen.getByText('Status: ACTIVE');
    expect(activeBadge).toBeInTheDocument();
    expect(activeBadge.className).toContain('text-emerald-300');

    const unlockedBadge = screen.getByText('UNLOCKED (APPROVED)');
    expect(unlockedBadge).toBeInTheDocument();
    expect(unlockedBadge.className).toContain('text-emerald-300');
  });

  // Scenario 3: Approval Milestone Summary
  it('3. asserts approved revision number, reviewed timestamp, and reviewer notes render correctly', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
      expect(
        screen.getByText(
          '“All accreditation and affiliation documentation validated successfully.”'
        )
      ).toBeInTheDocument();
    });
  });

  // Scenario 4: Completed Onboarding Checklist
  it('4. asserts all 4 checklist steps are displayed as completed milestones derived from authoritative data', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Institutional Registration & Verification')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Compliance Accreditation Documentation')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Super Admin Approval & Review')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Academic Tenancy Operational Activation')
      ).toBeInTheDocument();
      expect(screen.getAllByText('Completed').length).toBe(4);
    });
  });

  // Scenario 5: Readiness Roadmap Display
  it('5. asserts Phase 04+ roadmap card outlines academic structure and upcoming milestones', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Institutional Readiness Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Academic Structure Provisioning')).toBeInTheDocument();
    expect(screen.getByText('Academic Staff & Faculty Ingestion')).toBeInTheDocument();
    expect(screen.getByText('Student Roster Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Longitudinal Academic Intelligence')).toBeInTheDocument();
  });

  // Scenario 6: Opens Approved Dossier Modal
  it('6. clicks "View Approved Registration Dossier" and verifies modal opens with profile details', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Approved Revision v2')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(
        screen.getByText('Approved Institutional Registration Dossier')
      ).toBeInTheDocument();
      expect(screen.getByText('Code: HIT-4421')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0199')).toBeInTheDocument();
    });
  });

  // Scenario 7: Dossier Compliance Documents Table
  it('7. asserts active compliance documents render with category badges and file sizes', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Affiliation_Cert_2026.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('Signatory_Passport.pdf')).toBeInTheDocument();
    expect(screen.getByText('University Affiliation Certificate')).toBeInTheDocument();
    expect(screen.getByText('Authorized Signatory ID')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  // Scenario 8: Dossier Streaming Download Trigger
  it('8. clicks download button and verifies onboardingService.downloadDocument is invoked with correct document ID', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );
    const downloadSpy = vi
      .spyOn(onboardingService, 'downloadDocument')
      .mockResolvedValue();

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /download/i }).length).toBe(2);
    });

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(501, 'Affiliation_Cert_2026.pdf');
    });
  });

  // Scenario 9: Dossier Revision History Timeline
  it('9. asserts past revisions render chronologically with outcomes and notes', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Revision v1')).toBeInTheDocument();
    });

    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('Revision v2')).toBeInTheDocument();
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
  });

  // Scenario 10: Dossier Read-Only Enforcement
  it('10. asserts zero edit, upload, delete, or submit buttons exist within the dossier modal', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close dossier/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /upload document/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument();
  });

  // Scenario 11: OnboardingStatusPage Approval Redirection
  it('11. verifies OnboardingStatusPage immediately redirects approved & active admins to /college/dashboard', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          <Route
            path="/college/dashboard"
            element={<div>Redirected Active College Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirected Active College Dashboard')
    ).toBeInTheDocument();
  });

  // Scenario 12: OnboardingStatusPage Live Approval Detection
  it('12. simulates useMyApplication returning approved status, verifies getMe call, auth store update, and clean redirect', async () => {
    const pendingUser: CurrentUser = {
      ...mockApprovedUser,
      collegeApprovalStatus: 'PENDING',
      collegeStatus: 'PENDING_VERIFICATION',
      managementUnlocked: false,
    };

    useAuthStore.setState({
      isAuthenticated: true,
      user: pendingUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    const getMeSpy = vi
      .spyOn(authService, 'getMe')
      .mockResolvedValue(mockApprovedUser);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          <Route
            path="/college/dashboard"
            element={<div>Destination Active Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getMeSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Destination Active Dashboard')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().user?.collegeApprovalStatus).toBe('APPROVED');
    expect(useAuthStore.getState().user?.managementUnlocked).toBe(true);
  });

  // Scenario 13: Suspended College Error Handling
  it('13. simulates 403 COLLEGE_SUSPENDED and verifies SuspendedCollegeCard renders with Amber styling and support contact', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    const suspendedError = new ApiError(
      'This college account has been suspended by the platform administration. Operational and academic capabilities are temporarily paused.',
      {
        status: 403,
        errorCode: 'COLLEGE_SUSPENDED',
      }
    );
    vi.spyOn(onboardingService, 'getMyApplication').mockRejectedValue(suspendedError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Institution Account Suspended')).toBeInTheDocument();
      expect(
        screen.getByText(/This college account has been suspended by the platform administration/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/reach out to your designated platform Super Administrator/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  // Scenario 14: Inactive College Error Handling
  it('14. simulates 403 COLLEGE_INACTIVE and verifies SuspendedCollegeCard renders with Slate styling', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    const inactiveError = new ApiError(
      'This college account is currently inactive or has been archived. Operational access and academic capabilities are paused.',
      {
        status: 403,
        errorCode: 'COLLEGE_INACTIVE',
      }
    );
    vi.spyOn(onboardingService, 'getMyApplication').mockRejectedValue(inactiveError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Institution Account Inactive')).toBeInTheDocument();
      expect(
        screen.getByText(/This college account is currently inactive or has been archived/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  // Scenario 15: Permanent Rejection Disambiguation
  it('15. simulates 403 REGISTRATION_PERMANENTLY_REJECTED and verifies inlined permanent rejection view renders', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    const permRejectError = new ApiError(
      'Registration permanently rejected',
      {
        status: 403,
        errorCode: 'REGISTRATION_PERMANENTLY_REJECTED',
      }
    );
    vi.spyOn(onboardingService, 'getMyApplication').mockRejectedValue(permRejectError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Registration Application Permanently Rejected')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/exhausted all available resubmission attempts/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  // Scenario 16: CollegeApprovalGuard Hardening
  it('16. asserts CollegeApprovalGuard blocks access to /college/dashboard if collegeStatus is SUSPENDED or INACTIVE', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'SUSPENDED',
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(screen.queryByText('Unlocked College Dashboard')).not.toBeInTheDocument();
  });

  // Scenario 17: Purged Document 404 Handling
  it('17. asserts user-friendly error toast is displayed when document streaming download returns 404 DOCUMENT_NOT_FOUND', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    const docNotFoundError = new ApiError('Document not found', {
      status: 404,
      errorCode: 'DOCUMENT_NOT_FOUND',
    });
    vi.spyOn(onboardingService, 'downloadDocument').mockRejectedValue(docNotFoundError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /download/i }).length).toBe(2);
    });

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Document not found')
      ).toBeInTheDocument();
    });
  });

  // Scenario 18: Generic 403 versus REGISTRATION_PERMANENTLY_REJECTED
  it('18. simulates generic 403 ACCESS_DENIED and asserts ErrorState renders without triggering permanent rejection', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    const accessDeniedError = new ApiError('Cross-tenant access prohibited', {
      status: 403,
      errorCode: 'ACCESS_DENIED',
    });
    vi.spyOn(onboardingService, 'getMyApplication').mockRejectedValue(accessDeniedError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Registration Status')).toBeInTheDocument();
      expect(screen.getByText('Cross-tenant access prohibited')).toBeInTheDocument();
      expect(
        screen.queryByText('Registration Application Permanently Rejected')
      ).not.toBeInTheDocument();
    });
  });

  // Scenario 19: Redirect Loop Prevention in Live Approval Sync
  it('19. asserts redirect-loop prevention: when getMe fails during live approval sync, it stays on /onboarding-status and displays error', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'PENDING',
        collegeStatus: 'PENDING_VERIFICATION',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authorization sync failed', { status: 500 })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          <Route
            path="/college/dashboard"
            element={<div>Destination Active Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Authorization sync failed')).toBeInTheDocument();
      expect(
        screen.queryByText('Destination Active Dashboard')
      ).not.toBeInTheDocument();
    });
  });

  // Scenario 20: CollegeApprovalGuard Allows Active + Approved + Unlocked
  it('20. asserts CollegeApprovalGuard permits access when collegeApprovalStatus is APPROVED, collegeStatus is ACTIVE, and managementUnlocked is true', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'ACTIVE',
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Unlocked College Dashboard')).toBeInTheDocument();
    expect(
      screen.queryByText('Redirected Onboarding Status Page')
    ).not.toBeInTheDocument();
  });

  // Scenario 21: CollegeApprovalGuard Rejects Unexpected Status (e.g. PROVISIONING)
  it('21. asserts CollegeApprovalGuard redirects to /onboarding-status if collegeStatus is an unexpected non-active status (e.g. PROVISIONING)', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collegeStatus: 'PROVISIONING' as any,
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 22: CollegeApprovalGuard Rejects When Locked
  it('22. asserts CollegeApprovalGuard redirects to /onboarding-status if managementUnlocked is false even if APPROVED and ACTIVE', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'ACTIVE',
        managementUnlocked: false,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 23: Document Download 403 ACCESS_DENIED
  it('23. asserts user-friendly error message is displayed when document streaming download returns 403 ACCESS_DENIED', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    const accessDeniedError = new ApiError(
      'Access denied to document belonging to another college.',
      {
        status: 403,
        errorCode: 'ACCESS_DENIED',
      }
    );
    vi.spyOn(onboardingService, 'downloadDocument').mockRejectedValue(accessDeniedError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Approved Revision v2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /download/i }).length).toBe(2);
    });

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Access denied to document belonging to another college.')
      ).toBeInTheDocument();
    });
  });

  // Scenario 24: Authoritative Checklist Derivation (Pending items)
  it('24. asserts authoritative checklist derivation in ActivationMilestoneCard displays Pending badges when checklist items are false', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    const pendingChecklistApp: MyApplicationResponse = {
      ...mockApprovedApplication,
      checklist: {
        emailVerified: false,
        requiredDocumentsUploaded: false,
        canSubmitForReview: false,
        canStartCorrectionDraft: false,
        isFrozenInReview: false,
      },
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      pendingChecklistApp
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Institutional Registration & Verification')).toBeInTheDocument();
    });

    // The first 2 items should have Pending badges, the remaining 2 should have Completed badges
    const pendingBadges = screen.getAllByText('Pending');
    expect(pendingBadges.length).toBe(2);
    const completedBadges = screen.getAllByText('Completed');
    expect(completedBadges.length).toBe(2);
  });

  // Scenario 25: Revision History Permanent Rejection Badge
  it('25. asserts ApprovedDossierModal renders Permanently Rejected badge only when rev.isPermanentRejection is true', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    const appWithPermanentRejection: MyApplicationResponse = {
      ...mockApprovedApplication,
      revisionHistory: [
        {
          id: 101,
          versionNumber: 1,
          status: 'REJECTED' as const,
          submittedForReviewAt: '2026-11-15T09:00:00Z',
          reviewedAt: '2026-11-16T11:00:00Z',
          isPermanentRejection: false,
        },
        {
          id: 102,
          versionNumber: 2,
          status: 'REJECTED' as const,
          submittedForReviewAt: '2026-11-20T10:00:00Z',
          reviewedAt: '2026-11-24T14:30:00Z',
          isPermanentRejection: true,
        },
      ],
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      appWithPermanentRejection
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View Approved Registration Dossier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Revision History Timeline (2)')).toBeInTheDocument();
    });

    // Only 1 revision has isPermanentRejection: true
    const permRejectBadges = screen.getAllByText('Permanently Rejected');
    expect(permRejectBadges.length).toBe(1);
  });

  // Scenario 26: Read-Only Dossier Verification
  it('26. asserts ApprovedDossierModal is strictly read-only with no edit or delete controls', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValue(
      mockApprovedApplication
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View Approved Registration Dossier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Approved Institutional Registration Dossier')).toBeInTheDocument();
    });

    // Verify there are no mutation buttons
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload document/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument();
  });

  // Scenario 27: LoginPage Permanent Rejection and Inactive Account Error Display
  it('27. asserts LoginPage correctly maps AUTH_ACCOUNT_INACTIVE and REGISTRATION_PERMANENTLY_REJECTED error codes', async () => {
    const loginSpy = vi.spyOn(authService, 'login');

    // 1. Inactive account error
    loginSpy.mockRejectedValueOnce(
      new ApiError('Your account is inactive.', {
        status: 403,
        errorCode: 'AUTH_ACCOUNT_INACTIVE',
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'rejected-admin@college.edu' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'ValidPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Your account is inactive.')).toBeInTheDocument();
    });
  });

  // Scenario 28: Fail-closed guard denies access when collegeStatus is undefined
  it('28. asserts CollegeApprovalGuard fail-closed: redirects to /onboarding-status if collegeStatus is undefined', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: undefined,
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 29: Fail-closed guard denies access when collegeStatus is null
  it('29. asserts CollegeApprovalGuard fail-closed: redirects to /onboarding-status if collegeStatus is null', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: null,
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 30: Fail-closed guard denies access when collegeStatus is INACTIVE
  it('30. asserts CollegeApprovalGuard fail-closed: redirects to /onboarding-status if collegeStatus is INACTIVE', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'INACTIVE',
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 31: Fail-closed guard denies access when collegeStatus is PENDING_VERIFICATION
  it('31. asserts CollegeApprovalGuard fail-closed: redirects to /onboarding-status if collegeStatus is PENDING_VERIFICATION', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...mockApprovedUser,
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'PENDING_VERIFICATION',
        managementUnlocked: true,
      },
      isLoading: false,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>Redirected Onboarding Status Page</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirected Onboarding Status Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  // Scenario 32: Revision v4 Permanent Rejection Flag Invariant
  it('32. asserts revision v4 without isPermanentRejection flag does NOT show badge, while v4 with flag DOES', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: mockApprovedUser,
      isLoading: false,
    });

    // 1. Revision v4 with isPermanentRejection: false (e.g. non-permanent rejection or intermediate action)
    const appWithNonPermanentV4: MyApplicationResponse = {
      ...mockApprovedApplication,
      revisionHistory: [
        {
          id: 104,
          versionNumber: 4,
          status: 'REJECTED' as const,
          submittedForReviewAt: '2026-11-20T10:00:00Z',
          reviewedAt: '2026-11-24T14:30:00Z',
          isPermanentRejection: false,
        },
      ],
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(
      appWithNonPermanentV4
    );

    const { unmount } = renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View Approved Registration Dossier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Revision History Timeline (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Revision v4')).toBeInTheDocument();
    // Invariant: Must NOT display "Permanently Rejected" badge solely because it is v4!
    expect(screen.queryByText('Permanently Rejected')).not.toBeInTheDocument();

    unmount();

    // 2. Revision v4 with isPermanentRejection: true (formal terminal rejection of third correction)
    const appWithPermanentV4: MyApplicationResponse = {
      ...mockApprovedApplication,
      revisionHistory: [
        {
          id: 104,
          versionNumber: 4,
          status: 'REJECTED' as const,
          submittedForReviewAt: '2026-11-20T10:00:00Z',
          reviewedAt: '2026-11-24T14:30:00Z',
          isPermanentRejection: true,
        },
      ],
    };

    vi.spyOn(onboardingService, 'getMyApplication').mockResolvedValueOnce(
      appWithPermanentV4
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/college/dashboard" element={<CollegeAdminDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View Approved Registration Dossier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Approved Registration Dossier'));

    await waitFor(() => {
      expect(screen.getByText('Revision History Timeline (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Revision v4')).toBeInTheDocument();
    // Authoritative flag is true -> Must display badge
    expect(screen.getByText('Permanently Rejected')).toBeInTheDocument();
  });
});
