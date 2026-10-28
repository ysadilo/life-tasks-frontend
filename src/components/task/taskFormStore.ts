import { useSyncExternalStore } from 'react';
import type { Task } from '../../models';
import type { TaskDraft } from '../../lib/quickAdd';

interface TaskFormState {
  open: boolean;
  task: Task | null;
  /** `view` is the read-only details of `task` (with an Edit button); `edit` is the form. */
  mode: 'view' | 'edit';
  /** Prefills the due date for a new task (e.g. clicking a calendar day). `YYYY-MM-DD`. */
  presetDate: string | null;
  /** Prefills a new task from the quick-add line. */
  draft: TaskDraft | null;
}

let state: TaskFormState = { open: false, task: null, mode: 'edit', presetDate: null, draft: null };
const listeners = new Set<() => void>();

function set(next: TaskFormState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const taskForm = {
  openNew: (presetDate: string | null = null, draft: TaskDraft | null = null) =>
    set({ open: true, task: null, mode: 'edit', presetDate, draft }),
  openView: (task: Task) => set({ open: true, task, mode: 'view', presetDate: null, draft: null }),
  openEdit: (task: Task) => set({ open: true, task, mode: 'edit', presetDate: null, draft: null }),
  close: () => set({ open: false, task: null, mode: 'edit', presetDate: null, draft: null }),
};

export function useTaskFormState() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => state
  );
}
