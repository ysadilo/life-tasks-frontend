import { useSyncExternalStore } from 'react';
import type { Task } from '../../models';

interface TaskFormState {
  open: boolean;
  task: Task | null;
}

let state: TaskFormState = { open: false, task: null };
const listeners = new Set<() => void>();

function set(next: TaskFormState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const taskForm = {
  openNew: () => set({ open: true, task: null }),
  openEdit: (task: Task) => set({ open: true, task }),
  close: () => set({ open: false, task: null }),
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
