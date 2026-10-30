import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { setActiveBoardId, useActiveBoardId } from '../lib/activeBoard';
import { localISODate } from '../lib/dateUtils';
import { AVATAR_SIDE, COVER_SIDE, resizeToWebp, uploadImage } from '../lib/images';
import type { Board, BoardInvite, BoardJoinPreview, NewBoardInput } from '../models';

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>(`/boards?today=${localISODate()}`),
    // The switcher shows live task counts, so refresh whenever a board list is (re)mounted.
    staleTime: 0,
  });
}

export function useJoinPreview(code: string) {
  return useQuery({
    queryKey: ['board-join', code],
    queryFn: () => api.get<BoardJoinPreview>(`/boards/join/${code}`),
    retry: false,
  });
}

export function useJoinBoard() {
  const queryClient = useQueryClient();
  const switchBoard = useSwitchBoard();
  return useMutation({
    mutationFn: (code: string) => api.post<{ boardId: string }>(`/boards/join/${code}`, {}),
    onSuccess: async ({ boardId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boards'] }),
        queryClient.invalidateQueries({ queryKey: ['board-invites'] }),
      ]);
      switchBoard(boardId);
    },
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
      /** False until the boards list has loaded (`shared` is false meanwhile). */
      ready: !!board,
      shared: !!board?.shared,
      isOwner: board?.role === 'owner',
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
      api.post<{ id: string } | null>(`/boards/${boardId}/invites`, { email }),
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
function useBoardMutation<V, R = unknown>(mutationFn: (variables: V) => Promise<R>) {
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

/** Creates the board's join link (or returns the existing one). */
export const useCreateInviteLink = () =>
  useBoardMutation((boardId: string) => api.post<{ code: string }>(`/boards/${boardId}/invite-link`, {}));

/** Turns the link off; creating it again gives a new code. */
export const useDisableInviteLink = () =>
  useBoardMutation((boardId: string) => api.delete<void>(`/boards/${boardId}/invite-link`));

/** Re-encodes the picked photo to a small WebP and uploads it as the board's cover (owner only). */
export const useSetBoardCover = () =>
  useBoardMutation(async ({ id, file }: { id: string; file: File }) =>
    uploadImage(await resizeToWebp(file, COVER_SIDE, false), `/boards/${id}/cover`)
  );

export const useClearBoardCover = () => useBoardMutation((id: string) => api.delete<void>(`/boards/${id}/cover`));

/** The signed-in user's avatar image key, read off their membership (every user has at least one board). */
export function useMyAvatarKey(): string | null {
  const { data: boards } = useBoards();
  return boards?.flatMap((b) => b.members).find((m) => m.isMe)?.avatarKey ?? null;
}

export const useSetAvatar = () =>
  useBoardMutation(async (file: File) => uploadImage(await resizeToWebp(file, AVATAR_SIDE, true), '/me/avatar'));

export const useClearAvatar = () => useBoardMutation<void>(() => api.delete<void>('/me/avatar'));
