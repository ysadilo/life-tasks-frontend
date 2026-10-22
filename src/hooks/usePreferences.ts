import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GroupBy } from '../lib/taskGrouping';
import type { SortBy } from '../components/task';

/** Per-user view choices, stored on the server so they follow the user across devices. */
export interface Preferences {
  todaySortBy: SortBy;
  backlogGroupBy: GroupBy;
}

const DEFAULTS: Preferences = { todaySortBy: 'priority', backlogGroupBy: 'area' };
const KEY = ['preferences'];

export function usePreferences() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: KEY, queryFn: () => api.get<Preferences>('/preferences') });

  const update = useMutation({
    mutationFn: (patch: Partial<Preferences>) => api.patch<Preferences>('/preferences', patch),
    // Optimistic: the menu should react instantly; roll back if the server rejects it.
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Preferences>(KEY);
      queryClient.setQueryData<Preferences>(KEY, { ...DEFAULTS, ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => queryClient.setQueryData(KEY, context?.previous),
  });

  return { preferences: { ...DEFAULTS, ...data }, update: update.mutate };
}
