import { useState } from 'react';
import { useAgents } from '../../hooks/useAgents';
import { AgentActivity } from './AgentActivity';
import { AgentPermissions } from './AgentPermissions';
import { AgentTools } from './AgentTools';
import { ConnectAgent } from './ConnectAgent';
import { ConnectedAgents } from './ConnectedAgents';
import styles from './agents.module.css';

/** Settings › AI agents: connect an assistant, see what it did, and decide what it may do. */
export function AgentsSettings() {
  const { data } = useAgents();
  const [selectedId, setSelectedId] = useState<string>();
  const agents = data?.agents ?? [];
  // Permissions edit the chosen agent, or the first one until the user picks.
  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  return (
    <div className={styles.columns}>
      <div className={styles.column}>
        <ConnectAgent serverUrl={data?.serverUrl ?? null} />
        <AgentTools />
      </div>
      <div className={styles.column}>
        <ConnectedAgents agents={agents} selectedId={selected?.id} onManage={setSelectedId} />
        {selected && <AgentPermissions key={selected.id} agent={selected} />}
        <AgentActivity />
      </div>
    </div>
  );
}
