import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { localDayAsUTC, localISODate, useLocalToday } from '../lib/dateUtils';
import type { Energy, LifeAreaId, Priority, Recurrence, Task, TaskStatus } from '../models';

export type ResolveMissedAction = 'done' | 'dismiss' | 'addToday';

export interface TaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  todayDate?: string | null;
  areaId?: LifeAreaId | null;
  priority?: Priority | null;
  energy?: Energy | null;
  estimatedMinutes?: number | null;
  recurrence?: Recurrence | null;
  recurrenceEndDate?: string | null;
}

/** Passing the local calendar day drives the BE's lazy today→triage rollover
 *  and recurring missed-occurrence detection (see the tasks-backend repo). */
export function useTasksByStatus(status: TaskStatus) {
  const today = useLocalToday();
  return useQuery({
    queryKey: ['tasks', { status, today }],
    queryFn: () => api.get<Task[]>(`/tasks?status=${status}&today=${today}`),
  });
}

export function useTasksInRange(from: string, to: string) {
  return useQuery({
    queryKey: ['tasks', { from, to }],
    queryFn: () => api.get<Task[]>(`/tasks?from=${from}&to=${to}`),
  });
}

/** Recurring series (the calendar/Today expand their virtual occurrences). */
export function useRecurringTasks() {
  const today = useLocalToday();
  return useQuery({
    queryKey: ['tasks', { recurring: true, today }],
    queryFn: () => api.get<Task[]>(`/tasks?recurring=true&today=${today}`),
  });
}

export function useToggleOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date, done }: { id: string; date: string; done: boolean }) =>
      api.patch<Task>(`/tasks/${id}`, { occurrenceDate: date, occurrenceDone: done }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useResolveMissedOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ResolveMissedAction }) =>
      api.patch<Task>(`/tasks/${id}`, { resolveMissedAction: action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; status: TaskStatus; dueDate?: string | null }) =>
      // Stamp the user's local day, not the server's UTC day, when entering Today.
      api.patch<Task>(
        `/tasks/${id}?today=${localISODate()}`,
        patch.status === 'today' ? { ...patch, todayDate: localDayAsUTC() } : patch
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => api.post<Task>(`/tasks?today=${localISODate()}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) =>
      api.patch<Task>(`/tasks/${id}?today=${localISODate()}`, input),
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
