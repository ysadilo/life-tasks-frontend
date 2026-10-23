import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  open = next;
  listeners.forEach((listener) => listener());
}

export const newBoardModal = {
  open: () => set(true),
  close: () => set(false),
};

export function useNewBoardModalOpen() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => open
  );
}
