import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  open = next;
  listeners.forEach((listener) => listener());
}

export const lifeAreasModal = {
  openManage: () => set(true),
  close: () => set(false),
};

export function useLifeAreasModalOpen() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => open
  );
}
