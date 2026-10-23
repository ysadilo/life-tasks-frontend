import { useSyncExternalStore } from 'react';
import type { MomentId } from '../../../lib/samoyed';

const PEEK_MS = 2500;

let current: MomentId | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

/** The dog peeks in from the corner for a moment. Fire from anywhere via `peek.show()`. */
export const peek = {
  show(moment: MomentId) {
    current = moment;
    listeners.forEach((l) => l());
    clearTimeout(timer);
    timer = setTimeout(() => {
      current = null;
      listeners.forEach((l) => l());
    }, PEEK_MS);
  },
};

export const usePeek = () =>
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current
  );
