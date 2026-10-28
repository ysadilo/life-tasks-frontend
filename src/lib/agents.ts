import type { Agent, AgentPermission } from '../models';
import { dayMonthLabel } from './dateUtils';

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

const DAY_MS = 24 * 3600_000;

export type AgentStatus = { kind: 'active' } | { kind: 'idle'; days: number } | { kind: 'never' };

/** "Active" if it called in the last day, otherwise how many days it has been quiet. */
export function agentStatus(agent: Agent, now = Date.now()): AgentStatus {
  if (!agent.lastUsedAt) return { kind: 'never' };
  const idle = now - new Date(agent.lastUsedAt).getTime();
  return idle < DAY_MS ? { kind: 'active' } : { kind: 'idle', days: Math.floor(idle / DAY_MS) };
}

/** An agent that can look but not change anything. */
export const isReadOnly = (agent: Agent) => agent.permissions.every((p) => p === 'read');

/** "09:41" today, "Yesterday 17:30" the day before, "12 Oct 17:30" before that (24-hour, as in the mockups). */
export function agentTimeLabel(iso: string, locale: string, yesterdayLabel: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((midnight(now) - midnight(date)) / (24 * 3600_000));
  if (daysAgo === 0) return time;
  if (daysAgo === 1) return `${yesterdayLabel} ${time}`;
  return `${dayMonthLabel(iso, locale)} ${time}`;
}
