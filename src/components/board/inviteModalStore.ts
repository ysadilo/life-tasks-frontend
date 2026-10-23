import { useSyncExternalStore } from 'react';

let boardId: string | null = null;
const listeners = new Set<() => void>();

function set(next: string | null) {
  boardId = next;
  listeners.forEach((listener) => listener());
}

export const inviteModal = {
  open: (id: string) => set(id),
  close: () => set(null),
};

/** The board whose invite popup is open, or null. */
export function useInviteModalBoardId() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => boardId
  );
}
