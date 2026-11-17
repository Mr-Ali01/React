// Standard API Response Structure matching backend com.acadlytic.common.response.ApiResponse
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

// MVP Active User Roles
export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN';

// Extensible Role Definition for Post-MVP
export type ExtendedUserRole = UserRole | 'ACADEMIC_STAFF' | 'STUDENT';

// User Context
export interface UserContext {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: ExtendedUserRole;
  collegeId?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
