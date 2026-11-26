import { PRIORITY_RANK } from './priority';
import { ENERGIES } from './taskMeta';
import type { LifeArea, Task } from '../models';

/** v7 Today "Sort by": the user's drag order, or by priority, energy or life area. */
export type SortBy = 'manual' | 'priority' | 'energy' | 'area';

export const SORT_OPTIONS: SortBy[] = ['manual', 'priority', 'energy', 'area'];

/** Older saved sorts (date, effort) fall back to priority. */
export const toSortBy = (value: string | undefined): SortBy =>
  SORT_OPTIONS.includes(value as SortBy) ? (value as SortBy) : 'priority';

const LAST = Number.MAX_SAFE_INTEGER;

/** Sorted copy of `tasks`; `manual` keeps the given order. Tasks missing the field go last. */
export function sortTasks(tasks: Task[], sortBy: SortBy, areas: LifeArea[] = []): Task[] {
  const rank = (task: Task): number => {
    switch (sortBy) {
      case 'manual':
        return 0;
      case 'priority':
        return task.priority ? PRIORITY_RANK[task.priority] : LAST;
      case 'energy':
        // Most demanding first, while there's still energy for it.
        return task.energy ? ENERGIES.length - ENERGIES.indexOf(task.energy) : LAST;
      case 'area':
        return areas.find((a) => a.id === task.areaId)?.order ?? LAST;
    }
  };
  return [...tasks].sort((a, b) => rank(a) - rank(b));
}
