import { useEffect, useRef, useState } from 'react';
import {
  useCreateTask,
  useDeleteTask,
  useRecurringTasks,
  useResolveMissedOccurrence,
  useTasksByStatus,
  useUpdateTaskStatus,
  type ResolveMissedAction,
} from './useTasks';
import type { Task } from '../models';

export type TriageAction = 'today' | 'backlog' | 'done' | 'drop';

export type TriageQueueItem = { kind: 'task'; task: Task } | { kind: 'missed'; task: Task };

interface HistoryEntry {
  task: Task;
  action: TriageAction;
}

/**
 * One-card-at-a-time queue mixing needs_triage tasks with recurring series
 * that have a flagged missed occurrence (task.missedDates). The queue is a
 * local snapshot taken on first load so cards don't reshuffle mid-session as
 * mutations invalidate the query; each action pops the front card and fires
 * the matching mutation in the background. Undo only covers the normal
 * needs_triage actions — resolving a missed occurrence isn't reversible
 * (it can touch completedDates/extraTodayDates), so those aren't undoable.
 */
export function useTriageQueue() {
  const { data: needsTriage, isLoading: loadingTriage, error: errorTriage } = useTasksByStatus('needs_triage');
  const { data: recurring, isLoading: loadingRecurring, error: errorRecurring } = useRecurringTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const resolveMissed = useResolveMissedOccurrence();

  const [queue, setQueue] = useState<TriageQueueItem[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const total = useRef(0);

  useEffect(() => {
    if (needsTriage && recurring && queue === null) {
      const missed = recurring.filter((task) => (task.missedDates ?? []).length > 0);
      const items: TriageQueueItem[] = [
        ...needsTriage.map((task): TriageQueueItem => ({ kind: 'task', task })),
        ...missed.map((task): TriageQueueItem => ({ kind: 'missed', task })),
      ];
      setQueue(items);
      total.current = items.length;
    }
  }, [needsTriage, recurring, queue]);

  const current = queue?.[0] ?? null;

  function act(action: TriageAction) {
    if (!current || current.kind !== 'task') return;
    const task = current.task;
    setQueue((q) => (q ?? []).slice(1));
    setHistory((h) => [...h, { task, action }]);

    switch (action) {
      case 'today':
        updateStatus.mutate({ id: task.id, status: 'today' });
        break;
      case 'backlog':
        updateStatus.mutate({ id: task.id, status: 'backlog' });
        break;
      case 'done':
        updateStatus.mutate({ id: task.id, status: 'done' });
        break;
      case 'drop':
        deleteTask.mutate(task.id);
        break;
    }
  }

  function actMissed(action: ResolveMissedAction) {
    if (!current || current.kind !== 'missed') return;
    const task = current.task;
    setQueue((q) => (q ?? []).slice(1));
    resolveMissed.mutate({ id: task.id, action });
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));

    switch (last.action) {
      // ponytail: dropped tasks are re-created on undo (new id, history lost) —
      // recreating is the lazy inverse of delete; a soft-delete/restore would
      // preserve identity, add if undo-after-drop ever needs to be exact. The
      // queue only gets the *restored* task (real id from the server), not the
      // stale one — acting on it again has to hit an id that still exists.
      case 'drop':
        createTask.mutate(
          {
            title: last.task.title,
            description: last.task.description,
            dueDate: last.task.dueDate,
            areaId: last.task.areaId ?? null,
            priority: last.task.priority ?? null,
            energy: last.task.energy ?? null,
            estimatedMinutes: last.task.estimatedMinutes ?? null,
            status: 'needs_triage',
          },
          { onSuccess: (restored) => setQueue((q) => [{ kind: 'task', task: restored }, ...(q ?? [])]) }
        );
        break;
      default:
        setQueue((q) => [{ kind: 'task', task: last.task }, ...(q ?? [])]);
        updateStatus.mutate({ id: last.task.id, status: 'needs_triage' });
        break;
    }
  }

  const done = queue !== null && queue.length === 0;

  return {
    current,
    /** 1-based position of `current` in the original queue. */
    index: total.current - (queue?.length ?? 0) + 1,
    total: total.current,
    act,
    actMissed,
    undo,
    canUndo: history.length > 0,
    history,
    isLoading: loadingTriage || loadingRecurring,
    error: errorTriage || errorRecurring,
    done,
  };
}
