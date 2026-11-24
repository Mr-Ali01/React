import { apiClient } from '@/services/api';
import {
  ApiResponse,
  CollegeRegistrationResponse,
  RegisterCollegeRequest,
} from '@/types';

/**
 * Service for public college registration intake (Phase 03, Module 3.1B).
 * Enforces exact 15-field backend API contract: POST /api/v1/college-registrations.
 */
export const collegeRegistrationService = {
  async registerCollege(
    payload: RegisterCollegeRequest
  ): Promise<CollegeRegistrationResponse> {
    const response = await apiClient.post<
      ApiResponse<CollegeRegistrationResponse>
    >('/college-registrations', payload);
    return response.data.data;
  },
};
