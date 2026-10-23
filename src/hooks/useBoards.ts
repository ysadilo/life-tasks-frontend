import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { setActiveBoardId, useActiveBoardId } from '../lib/activeBoard';
import type { Board, BoardInvite, NewBoardInput } from '../models';

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
  });
}

export function useBoardInvites() {
  return useQuery({
    queryKey: ['board-invites'],
    queryFn: () => api.get<BoardInvite[]>('/boards/invites'),
  });
}

/** Drops everything scoped to the previous board; the boards list itself is board-independent. */
function useResetBoardScopedQueries() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.resetQueries({
      predicate: ({ queryKey }) => queryKey[0] !== 'boards' && queryKey[0] !== 'board-invites',
    });
}

export function useSwitchBoard() {
  const resetScoped = useResetBoardScopedQueries();
  return (id: string) => {
    setActiveBoardId(id);
    void resetScoped();
  };
}

/** The board requests are currently scoped to: the stored choice, else the BE default (first board). */
export function useActiveBoard(): Board | undefined {
  const { data: boards } = useBoards();
  const activeId = useActiveBoardId();
  const resetScoped = useResetBoardScopedQueries();
  const active = boards?.find((b) => b.id === activeId);

  // A stored board that no longer exists (left, deleted) falls back to the default.
  const stale = !!boards && !!activeId && !active;
  useEffect(() => {
    if (!stale) return;
    setActiveBoardId(null);
    void resetScoped();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  return active ?? boards?.[0];
}

/** Members of the active board, for assigning and filtering; `shared` is false on personal boards. */
export function useBoardMembers() {
  const board = useActiveBoard();
  return useMemo(() => {
    const members = board?.shared ? board.members : [];
    return {
      shared: !!board?.shared,
      members,
      me: members.find((m) => m.isMe),
      byId: new Map(members.map((m) => [m.userId, m])),
    };
  }, [board]);
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  const switchBoard = useSwitchBoard();
  return useMutation({
    mutationFn: (input: NewBoardInput) => api.post<Board>('/boards', input),
    onSuccess: async (board) => {
      await queryClient.invalidateQueries({ queryKey: ['boards'] });
      switchBoard(board.id);
    },
  });
}

export function useInviteToBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, email }: { boardId: string; email: string }) =>
      api.post<void>(`/boards/${boardId}/invites`, { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const switchBoard = useSwitchBoard();
  return useMutation({
    mutationFn: (inviteId: string) => api.post<{ boardId: string }>(`/boards/invites/${inviteId}/accept`, {}),
    onSuccess: async ({ boardId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boards'] }),
        queryClient.invalidateQueries({ queryKey: ['board-invites'] }),
      ]);
      switchBoard(boardId);
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.delete<void>(`/boards/invites/${inviteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-invites'] }),
  });
}

/** Board mutations that change the boards list (and, when a board goes away, whatever was scoped to it). */
function useBoardMutation<V>(mutationFn: (variables: V) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export const useRenameBoard = () =>
  useBoardMutation(({ id, name }: { id: string; name: string }) => api.patch<Board>(`/boards/${id}`, { name }));

export const useDeleteBoard = () => useBoardMutation((id: string) => api.delete<void>(`/boards/${id}`));

export const useLeaveBoard = () => useBoardMutation((id: string) => api.delete<void>(`/boards/${id}/members/me`));

export const useRemoveMember = () =>
  useBoardMutation(({ boardId, userId }: { boardId: string; userId: string }) =>
    api.delete<void>(`/boards/${boardId}/members/${userId}`)
  );

export const useRevokeInvite = () =>
  useBoardMutation(({ boardId, inviteId }: { boardId: string; inviteId: string }) =>
    api.delete<void>(`/boards/${boardId}/invites/${inviteId}`)
  );
