import { apiClient } from './api';
import { ApiResponse, HealthStatus } from '@/types';

export const healthService = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await apiClient.get<ApiResponse<HealthStatus>>('/health');
    return response.data.data;
  },
};
