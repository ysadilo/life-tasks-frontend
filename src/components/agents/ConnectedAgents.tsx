import { useTranslation } from 'react-i18next';
import { agentStatus, isReadOnly } from '../../lib/agents';
import { dayMonthLabel } from '../../lib/dateUtils';
import { AgentAvatar } from './AgentAvatar';
import type { Agent } from '../../models';
import styles from './agents.module.css';

interface ConnectedAgentsProps {
  agents: Agent[];
  selectedId?: string;
  onManage: (id: string) => void;
  onRevoke: (agent: Agent) => void;
}

export function ConnectedAgents({ agents, selectedId, onManage, onRevoke }: ConnectedAgentsProps) {
  const { t, i18n } = useTranslation();

  const connectedOn = (agent: Agent) => dayMonthLabel(agent.createdAt, i18n.language);

  const statusOf = (agent: Agent) => {
    const status = agentStatus(agent);
    switch (status.kind) {
      case 'active':
        return (
          <span className={styles.active}>
            <span className={styles.dot} aria-hidden />
            {t('agents.connected.active')}
          </span>
        );
      case 'idle':
        return <span className={styles.idle}>{t('agents.connected.idle', { count: status.days })}</span>;
      case 'never':
        return <span className={styles.idle}>{t('agents.connected.neverUsed')}</span>;
    }
  };

  return (
    <section id="connected" className={styles.card}>
      <div className={styles.headingRow}>
        <h2 className={styles.title}>{t('agents.connected.title')}</h2>
        <button
          type="button"
          className={styles.pillButton}
          onClick={() => document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' })}
        >
          + {t('agents.connected.connect')}
        </button>
      </div>
      {agents.length === 0 ? (
        <p className={styles.hint}>{t('agents.connected.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {agents.map((agent) => (
            <li key={agent.id} className={styles.agentRow}>
              <AgentAvatar name={agent.name} />
              <div className={styles.agentText}>
                <button
                  type="button"
                  className={[styles.agentName, styles.agentSelect].join(' ')}
                  aria-current={agent.id === selectedId}
                  title={t('agents.connected.showPermissions', { name: agent.name })}
                  onClick={() => onManage(agent.id)}
                >
                  {agent.name}
                </button>
                <span className={styles.meta}>
                  {t('agents.connected.connectedOn', { date: connectedOn(agent) })} ·{' '}
                  {isReadOnly(agent)
                    ? t('agents.connected.readOnly')
                    : t('agents.connected.actions', { count: agent.actionsThisWeek })}
                </span>
              </div>
              {statusOf(agent)}
              {/* An active agent is managed; one gone quiet can be cut off right here. */}
              {agentStatus(agent).kind === 'active' ? (
                <button type="button" className={styles.pillButton} onClick={() => onManage(agent.id)}>
                  {t('agents.connected.manage')}
                </button>
              ) : (
                <button
                  type="button"
                  className={[styles.pillButton, styles.pillDanger].join(' ')}
                  onClick={() => onRevoke(agent)}
                >
                  {t('agents.connected.revoke')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
