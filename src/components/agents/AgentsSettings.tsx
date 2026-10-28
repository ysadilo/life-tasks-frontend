import { useState } from 'react';
import { useAgents } from '../../hooks/useAgents';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AgentsMobile } from './AgentsMobile';
import { AgentActivity } from './AgentActivity';
import { AgentPermissions } from './AgentPermissions';
import { AgentTools } from './AgentTools';
import { ConnectAgent } from './ConnectAgent';
import { ConnectedAgents } from './ConnectedAgents';
import { RevokeAgentDialog } from './RevokeAgentDialog';
import type { Agent } from '../../models';
import styles from './agents.module.css';

/** The AI agents page body: connect an assistant (left), decide what it may do and see what it did (right). */
export function AgentsSettings() {
  const { data } = useAgents();
  const [selectedId, setSelectedId] = useState<string>();
  const [revoking, setRevoking] = useState<Agent | null>(null);
  const mobile = useIsMobile();
  const agents = data?.agents ?? [];
  // Permissions edit the chosen agent, or the first one until the user picks.
  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  if (mobile) {
    return (
      <>
        <AgentsMobile data={data} onRevoke={setRevoking} />
        <RevokeAgentDialog agent={revoking} onClose={() => setRevoking(null)} />
      </>
    );
  }

  return (
    <div className={styles.columns}>
      <div className={styles.column}>
        <ConnectAgent serverUrl={data?.serverUrl ?? null} enabled={data?.enabled ?? true} />
        <ConnectedAgents agents={agents} selectedId={selected?.id} onManage={setSelectedId} onRevoke={setRevoking} />
        <AgentTools />
      </div>
      <div className={styles.column}>
        {selected && <AgentPermissions key={selected.id} agent={selected} onRevoke={setRevoking} />}
        <AgentActivity />
      </div>
      <RevokeAgentDialog agent={revoking} onClose={() => setRevoking(null)} />
    </div>
  );
}
