import { useState } from 'react';
import { useCreateTask } from './useTasks';
import { useBoardMembers } from './useBoards';
import { draftToInput, mustBeToday, type TaskDraft } from '../lib/quickAdd';
import type { TaskStatus } from '../models';

/** The review step for several tasks read from one photo: pick which to keep, edit one, add the rest in one go. */
export function usePhotoBatch(initial: TaskDraft[], onDone: () => void) {
  const board = useBoardMembers();
  const createTask = useCreateTask();
  const [drafts, setDrafts] = useState(initial);
  const [included, setIncluded] = useState(() => initial.map(() => true));
  const [editing, setEditing] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const chosen = drafts.filter((_, i) => included[i]);

  const toggle = (index: number) => setIncluded((prev) => prev.map((on, i) => (i === index ? !on : on)));
  const update = (index: number, draft: TaskDraft) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? draft : d)));

  const add = async (status: TaskStatus) => {
    setPending(true);
    setFailed(false);
    try {
      for (const [index, draft] of drafts.entries()) {
        if (!included[index]) continue;
        // Like the single form: a new task on a shared board starts on the creator's plate.
        const assigneeId = draft.assigneeId === undefined ? (board.me?.userId ?? null) : draft.assigneeId;
        await createTask.mutateAsync(draftToInput({ ...draft, assigneeId }, status, board.shared));
        // Tick off what is already created so a retry after a failure doesn't add it twice.
        setIncluded((prev) => prev.map((on, i) => (i === index ? false : on)));
      }
      onDone();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return {
    drafts,
    included,
    count: chosen.length,
    canBacklog: !chosen.some(mustBeToday),
    editing,
    setEditing,
    toggle,
    update,
    add,
    pending,
    failed,
  };
}
