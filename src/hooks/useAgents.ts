import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Agent, AgentActivityEntry, AgentConnectRequest, AgentPermission, AgentsResponse } from '../models';

const REFRESH_MS = 30_000;

export function useAgents() {
  return useQuery({ queryKey: ['agents'], queryFn: () => api.get<AgentsResponse>('/agents') });
}

/** What the connected agents did lately; they act on their own, so it polls. */
export function useAgentActivity() {
  return useQuery({
    queryKey: ['agentActivity'],
    queryFn: () => api.get<AgentActivityEntry[]>('/agents/activity'),
    refetchInterval: REFRESH_MS,
  });
}

interface AgentChanges {
  id: string;
  permissions?: AgentPermission[];
  boardIds?: string[];
}

/** Toggles apply instantly and roll back if the server refuses. */
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }: AgentChanges) => api.patch<Agent>(`/agents/${id}`, changes),
    onMutate: async ({ id, ...changes }) => {
      await queryClient.cancelQueries({ queryKey: ['agents'] });
      const previous = queryClient.getQueryData<AgentsResponse>(['agents']);
      if (previous) {
        queryClient.setQueryData<AgentsResponse>(['agents'], {
          ...previous,
          agents: previous.agents.map((a) => (a.id === id ? { ...a, ...changes } : a)),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(['agents'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useRevokeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/agents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });
}

/** The master "Allow agents" switch; flips instantly and rolls back if the server refuses. */
export function useSetAgentsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => api.patch<{ enabled: boolean }>('/agents/settings', { enabled }),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['agents'] });
      const previous = queryClient.getQueryData<AgentsResponse>(['agents']);
      if (previous) queryClient.setQueryData<AgentsResponse>(['agents'], { ...previous, enabled });
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(['agents'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });
}

/** Who is asking to connect, from the pending sign-in the approval page was opened with. */
export function useConnectRequest(request: string) {
  return useQuery({
    queryKey: ['agentConnectRequest', request],
    queryFn: () => api.post<AgentConnectRequest>('/agents/connect-request', { request }),
    enabled: request !== '',
    retry: false,
    staleTime: Infinity,
  });
}

interface ApprovalInput {
  request: string;
  /** Omit both to keep what an already-connected assistant has. */
  permissions?: AgentPermission[];
  boardIds?: string[];
  /** The person pressed Cancel. */
  deny?: boolean;
}

/** Saves the person's answer; the reply says where to send the browser back to the assistant. */
export function useApproveAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApprovalInput) => api.post<{ redirectUrl: string }>('/agents/connect', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });
}
