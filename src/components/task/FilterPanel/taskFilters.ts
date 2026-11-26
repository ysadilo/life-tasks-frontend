import type { Energy, LifeAreaId, Priority, Task } from '../../../models';

export interface TaskFilters {
  priorities: Priority[];
  energies: Energy[];
  areaIds: LifeAreaId[];
}

export const EMPTY_TASK_FILTERS: TaskFilters = { priorities: [], energies: [], areaIds: [] };

export function activeFilterCount(filters: TaskFilters): number {
  return filters.priorities.length + filters.energies.length + filters.areaIds.length;
}

export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  return (
    (filters.priorities.length === 0 || (!!task.priority && filters.priorities.includes(task.priority))) &&
    (filters.energies.length === 0 || (!!task.energy && filters.energies.includes(task.energy))) &&
    (filters.areaIds.length === 0 || (!!task.areaId && filters.areaIds.includes(task.areaId)))
  );
}
