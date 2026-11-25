// Standard API Response Structure matching backend com.acadlytic.common.response.ApiResponse
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: Record<string, string> | string;
  timestamp: string;
}

// Health Check Response Payload
export interface HealthStatus {
  status: 'UP' | 'DOWN';
  application: string;
  version: string;
  environment: string;
  timestamp: string;
  database: 'CONNECTED' | 'DISCONNECTED' | 'UNHEALTHY';
}

// MVP Active User Roles matching backend com.acadlytic.modules.auth.entity.Role
export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN';

// Extensible Role Definition for Post-MVP
export type ExtendedUserRole = UserRole | 'ACADEMIC_STAFF' | 'STUDENT';

// College Approval Status matching backend CollegeApprovalStatus
export type CollegeApprovalStatus =
  'PENDING' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED';

// College Status matching backend CollegeStatus
export type CollegeStatus =
  'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

// User Account Status matching backend UserStatus
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';

// Current Authenticated User Context matching backend CurrentUserResponse
export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: UserRole;
  userStatus?: UserStatus;
  status?: UserStatus;
  collegeId?: number | null;
  collegeName?: string | null;
  collegeCode?: string | null;
  collegeApprovalStatus?: CollegeApprovalStatus | null;
  collegeStatus?: CollegeStatus | null;
  managementUnlocked: boolean;
  emailVerified: boolean;
  submittedForReview?: boolean;
}

// Auth Request Payloads
export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface VerifyEmailChangeRequest {
  token: string;
}

// Email Verification Payloads matching backend VerifyEmailRequest and VerifyEmailResponse
export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  email: string;
  emailVerified: boolean;
  verifiedAt: string; // ISO-8601 timestamp string
}

// College Registration Response matching backend CollegeRegistrationResponse
export interface CollegeRegistrationResponse {
  collegeId: number;
  registrationId: number;
  versionNumber: number;
  collegeName: string;
  collegeCode: string;
  status: CollegeApprovalStatus;
  adminEmail: string;
  submittedForReview: boolean;
  message?: string | null;
}

// Re-export registration form and API request types and functions
export {
  toRegisterCollegeRequest,
  registerCollegeSchema,
} from '@/schemas/registrationSchema';
export type {
  RegisterCollegeFormValues,
  RegisterCollegeRequest,
} from '@/schemas/registrationSchema';

// Re-export email verification schema and types
export { verifyEmailSchema } from '@/schemas/verificationSchema';
export type { VerifyEmailFormValues } from '@/schemas/verificationSchema';

// Module 3.3 Document Categories matching backend com.acadlytic.modules.colleges.entity.DocumentCategory
export type DocumentCategory =
  | 'UNIVERSITY_AFFILIATION_CERTIFICATE'
  | 'AUTHORIZED_SIGNATORY_ID'
  | 'INSTITUTION_REGISTRATION_PROOF'
  | 'ADDITIONAL_SUPPORTING_DOCUMENT';

// Module 3.3 College Onboarding DTOs
export interface CollegeSummaryResponse {
  id: number;
  name: string;
  code: string;
  approvalStatus: CollegeApprovalStatus;
  status: CollegeStatus;
}

export interface CollegeProfileResponse {
  legalName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  websiteUrl?: string | null;
  contactPhone: string;
  affiliatedUniversityName: string;
}

export interface CurrentRevisionResponse {
  id: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  submittedForReviewAt?: string | null;
  isDraft: boolean;
  profile: CollegeProfileResponse;
}

export interface ReviewFeedbackResponse {
  reviewNotes: string | null;
  rejectionReason: string | null;
  isPermanentRejection: boolean;
  reviewedAt: string | null;
}

export interface ResubmissionAllowanceResponse {
  resubmissionCount: number;
  actionRequiredCount: number;
  maxRejections: number;
  maxActionRequired: number;
}

export interface OnboardingChecklistResponse {
  emailVerified: boolean;
  requiredDocumentsUploaded: boolean;
  canSubmitForReview: boolean;
  canStartCorrectionDraft: boolean;
  isFrozenInReview?: boolean;
  frozenInReview?: boolean;
}

export interface DocumentResponse {
  id: number;
  registrationId: number;
  documentCategory: DocumentCategory;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  replacesDocumentId: number | null;
  createdAt: string;
}

export interface RevisionSummaryResponse {
  id: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  isPermanentRejection: boolean;
}

export interface MyApplicationResponse {
  college: CollegeSummaryResponse;
  currentRevision: CurrentRevisionResponse;
  reviewFeedback: ReviewFeedbackResponse;
  resubmission: ResubmissionAllowanceResponse;
  checklist: OnboardingChecklistResponse;
  activeDocuments: DocumentResponse[];
  revisionHistory: RevisionSummaryResponse[];
}

export interface UpdateApplicationRequest {
  legalName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  websiteUrl?: string | null;
  contactPhone: string;
  affiliatedUniversityName: string;
}

export interface SubmitApplicationResponse {
  registrationId: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  submittedForReviewAt: string;
  message: string;
}

// Re-export onboarding schemas and types
export {
  updateApplicationSchema,
  documentUploadSchema,
} from '@/schemas/onboardingSchema';
export type {
  UpdateApplicationFormValues,
  DocumentUploadFormValues,
} from '@/schemas/onboardingSchema';

// ==========================================
// Module 3.4 Super Admin Review Types & DTOs
// ==========================================

export type ReviewDecisionAction = 'APPROVE' | 'REQUEST_ACTION' | 'REJECT';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last: boolean;
  empty?: boolean;
}

export interface ReviewQueueItemResponse {
  collegeId: number;
  collegeCode: string;
  legalName: string;
  registrationId: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  submittedForReviewAt: string;
  adminName: string;
  adminEmail: string;
  resubmissionCount: number;
  actionRequiredCount: number;
  documentCount: number;
}

// ==========================================
// Raw Backend Review Detail Response DTOs
// Matching backend com.acadlytic.modules.colleges.dto
// ==========================================

export interface RawCollegeReviewSummaryResponse {
  id: number;
  name: string;
  code: string;
  approvalStatus: CollegeApprovalStatus;
  status: CollegeStatus;
  permanentlyRejected: boolean;
  resubmissionCount: number;
  actionRequiredCount: number;
  createdAt: string;
}

export interface RawReviewAdminUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
}

export interface RawSubmittedRevisionResponse {
  id: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  legalName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  websiteUrl?: string | null;
  contactPhone: string;
  affiliatedUniversityName: string;
  submittedForReviewAt?: string | null;
}

export interface RawReviewHistoryItemResponse {
  id: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  legalName: string;
  submittedForReviewAt?: string | null;
  reviewerUserId?: number | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  isPermanentRejection: boolean;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface RawCollegeReviewDetailResponse {
  college: RawCollegeReviewSummaryResponse;
  adminUser?: RawReviewAdminUserResponse | null;
  submittedRevision: RawSubmittedRevisionResponse;
  activeDocuments: DocumentResponse[];
  revisionHistory: RawReviewHistoryItemResponse[];
  concurrencyVersion: number;
}

// ==========================================
// Normalized Frontend Presentation Models
// ==========================================

export interface ReviewAdminUserResponse {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  registeredAt: string;
}

export interface SubmittedRevisionResponse {
  id: number;
  versionNumber: number;
  status: CollegeApprovalStatus;
  legalName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  websiteUrl?: string | null;
  contactPhone: string;
  affiliatedUniversityName: string;
  submittedForReviewAt?: string | null;
  reviewedAt?: string | null;
  isDraft?: boolean;
}

export interface ReviewHistoryItemResponse {
  id: number;
  versionNumber?: number;
  decision: ReviewDecisionAction;
  notes?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  isPermanentRejection?: boolean;
  actionRequiredCountAtDecision?: number;
  resubmissionCountAtDecision?: number;
  decisionAt: string;
  decisionByAdminEmail?: string | null;
  reviewerUserId?: number | null;
}

export interface CollegeReviewSummaryResponse {
  collegeId: number;
  id?: number;
  collegeCode: string;
  code?: string;
  legalName: string;
  name?: string;
  approvalStatus: CollegeApprovalStatus;
  status: CollegeStatus;
  registrationId?: number;
  versionNumber?: number;
  submittedForReviewAt?: string | null;
  concurrencyVersion: number;
  resubmissionCount: number;
  actionRequiredCount: number;
  permanentlyRejected?: boolean;
}

export interface CollegeReviewDetailResponse {
  college: CollegeReviewSummaryResponse;
  adminUser?: ReviewAdminUserResponse | null;
  activeDocuments: DocumentResponse[];
  currentRevision: SubmittedRevisionResponse;
  submittedRevision?: SubmittedRevisionResponse;
  submittedRevisions: SubmittedRevisionResponse[];
  reviewHistory: ReviewHistoryItemResponse[];
  revisionHistory?: RawReviewHistoryItemResponse[];
  concurrencyVersion: number;
}

export interface ReviewDecisionRequest {
  action: ReviewDecisionAction;
  expectedVersion: number;
  reviewNotes?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
}

export interface ReviewDecisionResponse {
  collegeId: number;
  registrationId?: number;
  versionNumber?: number;
  action?: ReviewDecisionAction;
  approvalStatus: CollegeApprovalStatus;
  concurrencyVersion?: number;
  message?: string;
  reviewedAt?: string;
  reviewerUserId?: number;
}

export interface ReviewQueueParams {
  search?: string;
  from?: string; // ISO-8601 Instant string
  to?: string;   // ISO-8601 Instant string
  page?: number; // 0-based
  size?: number; // default 20
  sort?: string; // e.g. 'submittedForReviewAt,asc'
}

// Re-export review schemas and types
export {
  reviewDecisionSchema,
  reviewQueueFilterSchema,
} from '@/schemas/reviewSchema';
export type {
  ReviewDecisionFormValues,
  ReviewQueueFilterFormValues,
} from '@/schemas/reviewSchema';



