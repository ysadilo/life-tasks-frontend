import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LifeAreaId, Task, TaskStatus } from '../models';

export interface TaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  todayDate?: string | null;
  area?: LifeAreaId | null;
}

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

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => api.post<Task>('/tasks', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) => api.patch<Task>(`/tasks/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
