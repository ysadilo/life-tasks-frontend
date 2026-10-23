import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'lt.activeBoardId';
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let activeBoardId = read();

/** The board the user last switched to; sent as `X-Board-Id` on every API call. */
export const getActiveBoardId = () => activeBoardId;

export function setActiveBoardId(id: string | null) {
  if (id === activeBoardId) return;
  activeBoardId = id;
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the choice just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
}

export function useActiveBoardId() {
  return useSyncExternalStore((onChange) => {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, getActiveBoardId);
}
