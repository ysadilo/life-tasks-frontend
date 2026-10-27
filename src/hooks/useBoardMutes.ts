import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const KEY = ['board-mutes'];

/** Boards the user turned push notifications off for; stored on the server so it follows them across devices. */
export function useBoardMuted(boardId: string) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: KEY, queryFn: () => api.get<string[]>('/notifications/mutes') });

  const setMuted = useMutation({
    mutationFn: (muted: boolean) => api.put<void>(`/notifications/mutes/${boardId}`, { muted }),
    onMutate: async (muted) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<string[]>(KEY);
      const others = (previous ?? []).filter((id) => id !== boardId);
      queryClient.setQueryData<string[]>(KEY, muted ? [...others, boardId] : others);
      return { previous };
    },
    onError: (_error, _muted, context) => queryClient.setQueryData(KEY, context?.previous),
  });

  return { muted: !!data?.includes(boardId), setMuted: setMuted.mutate };
}
