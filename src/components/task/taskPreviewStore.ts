import { useSyncExternalStore } from 'react';
import type { Task } from '../../models';

interface TaskPreviewState {
  open: boolean;
  task: Task | null;
}

let state: TaskPreviewState = { open: false, task: null };
const listeners = new Set<() => void>();

function set(next: TaskPreviewState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Read-only task view (calendar, past days) — open from anywhere via `taskPreview.open()`. */
export const taskPreview = {
  open: (task: Task) => set({ open: true, task }),
  close: () => set({ open: false, task: null }),
};

export function useTaskPreviewState() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => state
  );
}
