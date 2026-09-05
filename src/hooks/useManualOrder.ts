import { useCallback, useState } from 'react';
import type { Task } from '../models';

const STORAGE_KEY = 'life-tasks-today-manual-order';

function readOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Persists the user's drag order for the Today list's "Manual" sort mode. */
export function useManualOrder() {
  const [order, setOrder] = useState<string[]>(readOrder);

  const reorder = useCallback((ids: string[]) => {
    setOrder(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage unavailable (private mode, quota) — order won't persist across reloads.
    }
  }, []);

  /** Sorts by stored position; tasks with no stored position (new tasks) sort after ordered ones, keeping their relative order. */
  const applyOrder = useCallback(
    (tasks: Task[]): Task[] => {
      const index = new Map(order.map((id, i) => [id, i]));
      return [...tasks].sort((a, b) => (index.get(a.id) ?? Infinity) - (index.get(b.id) ?? Infinity));
    },
    [order]
  );

  return { applyOrder, reorder };
}
