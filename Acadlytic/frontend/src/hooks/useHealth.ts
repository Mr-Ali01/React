import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { HealthStatus } from '@/types';

export const useHealth = () => {
  return useQuery<HealthStatus, Error>({
    queryKey: ['systemHealth'],
    queryFn: healthService.getHealth,
    refetchInterval: 30000,
    retry: 1,
  });
};
