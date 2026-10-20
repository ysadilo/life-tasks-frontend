import { useSyncExternalStore } from 'react';

/** Keep in sync with the `curdle-away` duration in motion.css. */
const LEAVE_MS = 500;

let leaving = new Set<string>();
const listeners = new Set<() => void>();

function set(next: Set<string>) {
  leaving = next;
  listeners.forEach((listener) => listener());
}

/**
 * Plays the row's "curdle away" exit, then runs `action` (a status change). The row stays in its
 * leaving state until `action` settles, so it can't flash back while the lists refetch.
 */
export async function leaveThen(id: string, action: () => Promise<unknown>) {
  set(new Set(leaving).add(id));
  await new Promise((resolve) => setTimeout(resolve, LEAVE_MS));
  try {
    await action();
  } finally {
    const next = new Set(leaving);
    next.delete(id);
    set(next);
  }
}

export function useIsLeaving(id: string) {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => leaving.has(id)
  );
}
