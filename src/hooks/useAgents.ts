import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Agent, AgentActivityEntry, AgentPermission, AgentsResponse } from '../models';

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
