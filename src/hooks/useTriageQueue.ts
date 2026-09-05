import { useEffect, useRef, useState } from 'react';
import { useCreateTask, useDeleteTask, useTasksByStatus, useUpdateTaskStatus } from './useTasks';
import type { Task } from '../models';

export type TriageAction = 'today' | 'backlog' | 'done' | 'drop';

interface HistoryEntry {
  task: Task;
  action: TriageAction;
}

/**
 * One-card-at-a-time queue over the needs_triage tasks. The queue is a local
 * snapshot taken on first load so cards don't reshuffle mid-session as
 * mutations invalidate the query; each action pops the front card and fires
 * the matching mutation in the background, keeping a one-entry-per-step
 * history so the last call can be undone.
 */
export function useTriageQueue() {
  const { data, isLoading, error } = useTasksByStatus('needs_triage');
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [queue, setQueue] = useState<Task[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const total = useRef(0);

  useEffect(() => {
    if (data && queue === null) {
      setQueue(data);
      total.current = data.length;
    }
  }, [data, queue]);

  const current = queue?.[0] ?? null;

  function act(action: TriageAction) {
    if (!current) return;
    setQueue((q) => (q ?? []).slice(1));
    setHistory((h) => [...h, { task: current, action }]);

    switch (action) {
      case 'today':
        updateStatus.mutate({ id: current.id, status: 'today' });
        break;
      case 'backlog':
        updateStatus.mutate({ id: current.id, status: 'backlog' });
        break;
      case 'done':
        updateStatus.mutate({ id: current.id, status: 'done' });
        break;
      case 'drop':
        deleteTask.mutate(current.id);
        break;
    }
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
          { onSuccess: (restored) => setQueue((q) => [restored, ...(q ?? [])]) }
        );
        break;
      default:
        setQueue((q) => [last.task, ...(q ?? [])]);
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
    undo,
    canUndo: history.length > 0,
    history,
    isLoading,
    error,
    done,
  };
}
