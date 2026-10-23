import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ActivityEntry } from '../models';

const REFRESH_MS = 30_000;

/** Recent actions on the active shared board; teammates act too, so it also polls. */
export function useActivity(enabled: boolean) {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get<ActivityEntry[]>('/activity'),
    enabled,
    refetchInterval: REFRESH_MS,
  });
}
