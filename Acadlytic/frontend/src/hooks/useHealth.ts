import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { queryKeys } from '@/services/queryKeys';
import { HealthStatus } from '@/types';

export const useHealth = () => {
  return useQuery<HealthStatus, Error>({
    queryKey: queryKeys.system.health(),
    queryFn: healthService.getHealth,
    refetchInterval: 30000,
    retry: 1,
  });
};
