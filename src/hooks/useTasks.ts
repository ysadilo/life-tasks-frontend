import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Task, TaskStatus } from '../models';

export function useTasksByStatus(status: TaskStatus) {
  return useQuery({
    queryKey: ['tasks', { status }],
    queryFn: () => api.get<Task[]>(`/tasks?status=${status}`),
  });
}

export function useTasksInRange(from: string, to: string) {
  return useQuery({
    queryKey: ['tasks', { from, to }],
    queryFn: () => api.get<Task[]>(`/tasks?from=${from}&to=${to}`),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.patch<Task>(`/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
