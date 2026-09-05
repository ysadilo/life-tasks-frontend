import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LifeArea } from '../models';

export function useLifeAreas() {
  return useQuery({
    queryKey: ['life-areas'],
    queryFn: () => api.get<LifeArea[]>('/life-areas'),
  });
}

/** Id → area lookup, for rendering a task's stored `areaId` as a name/colour. */
export function useLifeAreaLookup() {
  const { data } = useLifeAreas();
  return useMemo(() => new Map((data ?? []).map((area) => [area.id, area])), [data]);
}

export function useCreateLifeArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<LifeArea>('/life-areas', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-areas'] }),
  });
}

export function useRenameLifeArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch<LifeArea>(`/life-areas/${id}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-areas'] }),
  });
}

export function useDeleteLifeArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/life-areas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] });
      // Deleting an area reassigns its tasks, so every task list is stale too.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
