export type AgentPermission = 'read' | 'add' | 'edit' | 'done' | 'triage' | 'delete';

/** An AI assistant (MCP client) the user connected through OAuth. */
export interface Agent {
  id: string;
  name: string;
  permissions: AgentPermission[];
  /** Boards the agent may use. */
  boardIds: string[];
  lastUsedAt: string | null;
  createdAt: string;
  actionsThisWeek: number;
}

export interface AgentsResponse {
  /** The MCP server URL to paste into an assistant; null when the server isn't configured for it. */
  serverUrl: string | null;
  /** The master "Allow agents" switch. */
  enabled: boolean;
  agents: Agent[];
}

export type AgentActionKind = 'read' | 'added' | 'edited' | 'moved' | 'done' | 'triaged' | 'deleted';

/** One feed entry; a run of like actions arrives already grouped. */
export interface AgentActivityEntry {
  id: string;
  agentName: string;
  kind: AgentActionKind;
  tasks: { id: string | null; title: string }[];
  detail: string | null;
  createdAt: string;
}

/** An agent that is mid-sign-in and waiting for the user to approve it. */
export interface AgentConnectRequest {
  name: string;
  /** The host the assistant will be sent back to; it names itself, so this is what to check. */
  redirectHost: string;
  /** It already has access (and permissions), so there is nothing to ask. */
  alreadyConnected: boolean;
}
