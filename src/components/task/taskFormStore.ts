import { useSyncExternalStore } from 'react';
import type { Task } from '../../models';

interface TaskFormState {
  open: boolean;
  task: Task | null;
  /** Prefills the due date for a new task (e.g. clicking a calendar day). `YYYY-MM-DD`. */
  presetDate: string | null;
}

let state: TaskFormState = { open: false, task: null, presetDate: null };
const listeners = new Set<() => void>();

function set(next: TaskFormState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const taskForm = {
  openNew: (presetDate: string | null = null) => set({ open: true, task: null, presetDate }),
  openEdit: (task: Task) => set({ open: true, task, presetDate: null }),
  close: () => set({ open: false, task: null, presetDate: null }),
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
