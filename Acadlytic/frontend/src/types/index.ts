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

