import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { peek } from '../components/ui';
import { getActiveBoardId } from '../lib/activeBoard';
import { bumpAdded, bumpDone, unbumpDone } from '../lib/samoyed';
import { localDayAsUTC, localISODate, useLocalToday } from '../lib/dateUtils';
import type { Energy, Feeling, LifeAreaId, Priority, Recurrence, RecurrenceUnit, Task, TaskStatus } from '../models';

/** Task changes also add entries to a shared board's activity feed. */
function invalidateTasks(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    queryClient.invalidateQueries({ queryKey: ['activity'] }),
  ]);
}

/** Counts a completion (or takes one back) in the active board's Samoyed tally. */
function tallyDone(done: boolean) {
  const boardId = getActiveBoardId() ?? '';
  if (!done) return unbumpDone(boardId);
  const milestone = bumpDone(boardId);
  if (milestone) peek.show(milestone);
}

/** The cached status of a task, to tell a real done/un-done change from a re-save (e.g. adding a check-in). */
function cachedStatus(queryClient: QueryClient, id: string) {
  return queryClient
    .getQueriesData<Task[]>({ queryKey: ['tasks'] })
    .flatMap(([, tasks]) => tasks ?? [])
    .find((t) => t.id === id)?.status;
}

export type ResolveMissedAction = 'done' | 'dismiss' | 'addToday';

export interface TaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  todayDate?: string | null;
  areaId?: LifeAreaId | null;
  assigneeId?: string | null;
  priority?: Priority | null;
  energy?: Energy | null;
  estimatedMinutes?: number | null;
  recurrence?: Recurrence | null;
  recurrenceInterval?: number | null;
  recurrenceUnit?: RecurrenceUnit | null;
  recurrenceEndDate?: string | null;
}

/** Every user-editable field of a task, for re-creating it (undo-delete, copy). Callers set `status`. */
export function taskToInput(task: Task): TaskInput {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    areaId: task.areaId ?? null,
    assigneeId: task.assigneeId ?? null,
    priority: task.priority ?? null,
    energy: task.energy ?? null,
    estimatedMinutes: task.estimatedMinutes ?? null,
    recurrence: task.recurrence ?? null,
    recurrenceEndDate: task.recurrenceEndDate ?? null,
  };
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
    mutationFn: ({
      id,
      date,
      done,
      feeling,
      actualMinutes,
    }: {
      id: string;
      date: string;
      done: boolean;
      feeling?: Feeling | null;
      actualMinutes?: number | null;
    }) =>
      api.patch<Task>(`/tasks/${id}`, {
        occurrenceDate: date,
        occurrenceDone: done,
        occurrenceFeeling: feeling,
        occurrenceMinutes: actualMinutes,
      }),
    onSuccess: (_task, { done }) => {
      tallyDone(done);
      invalidateTasks(queryClient);
    },
  });
}

export function useResolveMissedOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ResolveMissedAction }) =>
      api.patch<Task>(`/tasks/${id}`, { resolveMissedAction: action }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      status: TaskStatus;
      dueDate?: string | null;
      feeling?: Feeling | null;
      actualMinutes?: number | null;
      assigneeId?: string | null;
    }) =>
      // Stamp the user's local day, not the server's UTC day, when entering Today.
      api.patch<Task>(
        `/tasks/${id}?today=${localISODate()}`,
        patch.status === 'today' ? { ...patch, todayDate: localDayAsUTC() } : patch
      ),
    onSuccess: (_task, { id, status }) => {
      const wasDone = cachedStatus(queryClient, id) === 'done';
      if (status === 'done' && !wasDone) tallyDone(true);
      else if (status !== 'done' && wasDone) tallyDone(false);
      invalidateTasks(queryClient);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => api.post<Task>(`/tasks?today=${localISODate()}`, input),
    onSuccess: () => {
      invalidateTasks(queryClient);
      // The 10th-add nudge ("park some in Backlog?") only makes sense when Today is already crowded.
      const todayCount = queryClient
        .getQueriesData<Task[]>({
          predicate: (q) => (q.queryKey[1] as { status?: TaskStatus } | undefined)?.status === 'today',
        })
        .reduce((sum, [, tasks]) => sum + (tasks?.length ?? 0), 0);
      const milestone = bumpAdded((id) => id !== 'added10' || todayCount >= 6);
      if (milestone) peek.show(milestone);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) =>
      api.patch<Task>(`/tasks/${id}?today=${localISODate()}`, input),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onSuccess: () => invalidateTasks(queryClient),
  });
}
