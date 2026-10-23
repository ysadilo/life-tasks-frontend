import { useEffect, useRef, useState } from 'react';
import {
  taskToInput,
  useCreateTask,
  useDeleteTask,
  useRecurringTasks,
  useResolveMissedOccurrence,
  useTasksByStatus,
  useUpdateTaskStatus,
  type ResolveMissedAction,
} from './useTasks';
import { useBoardMembers } from './useBoards';
import { inMyTriage } from '../lib/triageScope';
import type { BoardMember, Task } from '../models';

export type TriageAction = 'today' | 'backlog' | 'done' | 'drop';

export type TriageQueueItem = { kind: 'task'; task: Task } | { kind: 'missed'; task: Task };

interface HistoryEntry {
  task: Task;
  action: TriageAction;
  /** Set when the card was handed to another member rather than taken. */
  handedTo?: BoardMember;
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
  const { ready, shared, me, members, isOwner } = useBoardMembers();

  const [queue, setQueue] = useState<TriageQueueItem[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const total = useRef(0);

  useEffect(() => {
    // Wait for the board so a shared board's per-member scoping applies to the snapshot.
    if (ready && needsTriage && recurring && queue === null) {
      const mine = (task: Task) => !shared || inMyTriage(task, me?.userId);
      const missed = recurring.filter((task) => (task.missedDates ?? []).length > 0 && mine(task));
      const items: TriageQueueItem[] = [
        ...needsTriage.filter(mine).map((task): TriageQueueItem => ({ kind: 'task', task })),
        ...missed.map((task): TriageQueueItem => ({ kind: 'missed', task })),
      ];
      setQueue(items);
      total.current = items.length;
    }
  }, [ready, shared, me?.userId, needsTriage, recurring, queue]);

  const current = queue?.[0] ?? null;

  // Leftovers waiting in other members' triage, grouped by member (shared boards only).
  const queuedIds = new Set((queue ?? []).map((item) => item.task.id));
  const others = shared
    ? members
        .filter((m) => !m.isMe)
        .map((member) => ({
          member,
          tasks: (needsTriage ?? []).filter((task) => task.assigneeId === member.userId && !queuedIds.has(task.id)),
        }))
    : [];

  // Hand-over targets: never the card's current assignee, and not yourself unless the card is someone else's
  // (an owner sorting a member's leftover can take it; for your own or unassigned cards "Today" already does).
  const assigneeId = current?.task.assigneeId ?? null;
  const handTargets = members.filter(
    (m) => m.userId !== assigneeId && (!m.isMe || (!!assigneeId && assigneeId !== me?.userId))
  );

  /** Owner only: pull one member's leftovers into this session. */
  function sortAsOwner(userId: string) {
    const tasks = others.find((o) => o.member.userId === userId)?.tasks ?? [];
    if (!isOwner || tasks.length === 0) return;
    setQueue((q) => [...(q ?? []), ...tasks.map((task): TriageQueueItem => ({ kind: 'task', task }))]);
    total.current += tasks.length;
  }

  function act(action: TriageAction) {
    if (!current || current.kind !== 'task') return;
    const task = current.task;
    setQueue((q) => (q ?? []).slice(1));
    setHistory((h) => [...h, { task, action }]);

    switch (action) {
      case 'today':
        // Taking an unassigned card on a shared board puts it on your plate.
        updateStatus.mutate({
          id: task.id,
          status: 'today',
          ...(shared && !task.assigneeId ? { assigneeId: me?.userId } : {}),
        });
        break;
      case 'backlog':
        // Clear the due date, or the BE would promote the overdue task straight back to Today.
        updateStatus.mutate({ id: task.id, status: 'backlog', dueDate: null });
        break;
      case 'done':
        updateStatus.mutate({ id: task.id, status: 'done' });
        break;
      case 'drop':
        deleteTask.mutate(task.id);
        break;
    }
  }

  /** Passes the card to another member's Today. */
  function handTo(member: BoardMember) {
    if (!current || current.kind !== 'task') return;
    const task = current.task;
    setQueue((q) => (q ?? []).slice(1));
    setHistory((h) => [...h, { task, action: 'today', handedTo: member }]);
    updateStatus.mutate({ id: task.id, status: 'today', assigneeId: member.userId });
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
          { ...taskToInput(last.task), status: 'needs_triage' },
          { onSuccess: (restored) => setQueue((q) => [{ kind: 'task', task: restored }, ...(q ?? [])]) }
        );
        break;
      default:
        setQueue((q) => [{ kind: 'task', task: last.task }, ...(q ?? [])]);
        updateStatus.mutate({
          id: last.task.id,
          status: 'needs_triage',
          dueDate: last.task.dueDate,
          ...(shared ? { assigneeId: last.task.assigneeId ?? null } : {}),
        });
        break;
    }
  }

  const done = queue !== null && queue.length === 0;

  return {
    current,
    /** Cards after `current`, in order. */
    upcoming: queue?.slice(1) ?? [],
    /** 1-based position of `current` in the original queue. */
    index: total.current - (queue?.length ?? 0) + 1,
    total: total.current,
    act,
    handTo,
    handTargets,
    others,
    sortAsOwner,
    isOwner,
    shared,
    actMissed,
    undo,
    canUndo: history.length > 0,
    history,
    isLoading: loadingTriage || loadingRecurring,
    error: errorTriage || errorRecurring,
    done,
  };
}
