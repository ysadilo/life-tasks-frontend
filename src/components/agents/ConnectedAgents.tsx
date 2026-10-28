import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, ConfirmDialog, toast } from '../ui';
import { useRevokeAgent } from '../../hooks/useAgents';
import { activityTimeLabel } from '../../lib/dateUtils';
import { AgentAvatar } from './AgentAvatar';
import type { Agent } from '../../models';
import styles from './agents.module.css';

interface ConnectedAgentsProps {
  agents: Agent[];
  selectedId?: string;
  onManage: (id: string) => void;
}

export function ConnectedAgents({ agents, selectedId, onManage }: ConnectedAgentsProps) {
  const { t, i18n } = useTranslation();
  const revoke = useRevokeAgent();
  const [revoking, setRevoking] = useState<Agent | null>(null);

  const lastUsed = (agent: Agent) =>
    agent.lastUsedAt ? activityTimeLabel(agent.lastUsedAt, i18n.language) : t('agents.connected.neverUsed');

  return (
    <section className={styles.card}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{t('agents.connected.title')}</h2>
      </div>
      {agents.length === 0 ? (
        <p className={styles.hint}>{t('agents.connected.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {agents.map((agent) => (
            <li key={agent.id} className={styles.agentRow}>
              <AgentAvatar name={agent.name} />
              <div className={styles.agentText}>
                <span className={styles.agentName}>
                  {agent.name}
                  {agent.id === selectedId && <Chip variant="accent">{t('agents.connected.managing')}</Chip>}
                </span>
                <span className={styles.meta}>
                  {t('agents.connected.actions', { count: agent.actionsThisWeek })} · {lastUsed(agent)}
                </span>
              </div>
              <button type="button" className={styles.linkButton} onClick={() => onManage(agent.id)}>
                {t('agents.connected.manage')}
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => setRevoking(agent)}>
                {t('agents.connected.revoke')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={revoking !== null}
        title={t('agents.connected.revoke')}
        message={t('agents.connected.revokeConfirm', { name: revoking?.name })}
        confirmLabel={t('agents.connected.revoke')}
        cancelLabel={t('board.cancel')}
        onCancel={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) revoke.mutate(revoking.id, { onSuccess: () => toast.show(t('agents.connected.revoked')) });
          setRevoking(null);
        }}
      />
    </section>
  );
}
