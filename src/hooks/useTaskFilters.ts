import { useMemo, useState } from 'react';
import { EMPTY_TASK_FILTERS, type TaskFilters } from '../components/task';
import { useAreaFilter } from './useAreaFilter';

/** A page's task filters: priority and energy in state, life areas in the URL so the sidebar can toggle them. */
export function useTaskFilters() {
  const [metaFilters, setMetaFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const { areaIds, setAreaIds } = useAreaFilter();
  // The URL hands back a new array every render; key on its contents so memoised lists downstream stay stable.
  const areaKey = areaIds.join(',');
  const filters = useMemo<TaskFilters>(
    () => ({ ...metaFilters, areaIds: areaKey ? areaKey.split(',') : [] }),
    [metaFilters, areaKey]
  );
  const setFilters = (next: TaskFilters) => {
    setMetaFilters({ ...next, areaIds: [] });
    setAreaIds(next.areaIds);
  };
  return { filters, setFilters };
}
