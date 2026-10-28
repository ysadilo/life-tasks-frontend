import { useTranslation } from 'react-i18next';
import { useUpdateAgent } from '../../hooks/useAgents';
import { PermissionsEditor } from './PermissionsEditor';
import type { Agent } from '../../models';
import styles from './agents.module.css';

/** What one agent may do, and on which boards. Changes apply to its very next call. */
export function AgentPermissions({ agent, onRevoke }: { agent: Agent; onRevoke: (agent: Agent) => void }) {
  const { t } = useTranslation();
  const update = useUpdateAgent();

  return (
    <section id="permissions" className={styles.card}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{t('agents.permissions.title', { name: agent.name })}</h2>
        <p className={styles.hint}>{t('agents.permissions.hint')}</p>
      </div>

      <PermissionsEditor
        agentName={agent.name}
        permissions={agent.permissions}
        boardIds={agent.boardIds}
        onPermissionsChange={(permissions) => update.mutate({ id: agent.id, permissions })}
        onBoardsChange={(boardIds) => update.mutate({ id: agent.id, boardIds })}
      />

      <button type="button" className={styles.dangerLink} onClick={() => onRevoke(agent)}>
        {t('agents.permissions.revokeAccess', { name: agent.name })}
      </button>
    </section>
  );
}
