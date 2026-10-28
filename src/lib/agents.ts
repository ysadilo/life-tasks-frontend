import type { AgentPermission } from '../models';

/** In the order Settings lists them; `delete` is last because it can't be undone. */
export const AGENT_PERMISSIONS: AgentPermission[] = ['read', 'add', 'edit', 'done', 'triage', 'delete'];

export const AGENT_CLIENTS = ['claude', 'chatgpt', 'cursor', 'other'] as const;
export type AgentClient = (typeof AGENT_CLIENTS)[number];

/** For clients configured with a file instead of a "custom connector" screen. */
export const mcpConfigJson = (url: string) => JSON.stringify({ mcpServers: { 'life-tasks': { url } } }, null, 2);

/** One or two letters for an agent's avatar: "Claude" → "C", "Cursor Agent" → "CA". */
export function agentInitials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?')[0]).toUpperCase();
}
