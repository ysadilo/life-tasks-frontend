import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidePanel, Switch, toast } from '../ui';
import { useSetAgentsEnabled } from '../../hooks/useAgents';
import { agentStatus, isReadOnly } from '../../lib/agents';
import { AgentActivity } from './AgentActivity';
import { AgentAvatar } from './AgentAvatar';
import { AgentPermissions } from './AgentPermissions';
import { ConnectAgent } from './ConnectAgent';
import type { Agent, AgentPermission, AgentsResponse } from '../../models';
import { AGENT_PERMISSIONS } from '../../lib/agents';
import styles from './agents.module.css';

type Sheet = { kind: 'agent'; id: string } | { kind: 'connect' } | { kind: 'activity' } | null;

interface AgentsMobileProps {
  data: AgentsResponse | undefined;
  onRevoke: (agent: Agent) => void;
}

/** The phone layout: grouped rows that open a sheet for the details. */
export function AgentsMobile({ data, onRevoke }: AgentsMobileProps) {
  const { t } = useTranslation();
  const setEnabled = useSetAgentsEnabled();
  const [sheet, setSheet] = useState<Sheet>(null);
  const agents = data?.agents ?? [];
  const first = agents[0];
  const sheetAgent = sheet?.kind === 'agent' ? agents.find((a) => a.id === sheet.id) : undefined;

  const copy = async () => {
    if (!data?.serverUrl) return;
    try {
      await navigator.clipboard.writeText(data.serverUrl);
      toast.show(t('agents.connect.copied'));
    } catch {
      toast.show(t('agents.connect.copyFailed'));
    }
  };

  const meta = (agent: Agent) => {
    const status = agentStatus(agent);
    const parts = [
      isReadOnly(agent) ? t('agents.mobile.readOnly') : t('agents.connected.actions', { count: agent.actionsThisWeek }),
    ];
    if (status.kind === 'idle') parts.push(t('agents.mobile.idle', { count: status.days }));
    return parts.join(' · ');
  };

  return (
    <div className={styles.mobile}>
      <div className={styles.group}>
        <div className={styles.groupRow}>
          <span className={styles.rowName}>{t('agents.connect.allowAgents')}</span>
          <Switch
            checked={data?.enabled ?? true}
            onChange={(on) => setEnabled.mutate(on)}
            label={t('agents.connect.allowAgents')}
          />
        </div>
        <div className={styles.groupRow}>
          <span className={styles.rowName}>{t('agents.mobile.serverUrl')}</span>
          <button type="button" className={styles.pillButton} disabled={!data?.serverUrl} onClick={copy}>
            {t('agents.connect.copy')}
          </button>
        </div>
      </div>

      <span className={styles.groupLabel}>{t('agents.mobile.connected')}</span>
      <div className={styles.group}>
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className={styles.groupRow}
            onClick={() => setSheet({ kind: 'agent', id: agent.id })}
          >
            <AgentAvatar name={agent.name} />
            <span className={styles.agentText}>
              <span className={styles.rowName}>{agent.name}</span>
              <span className={styles.meta}>{meta(agent)}</span>
            </span>
            <span className={styles.chevron} aria-hidden>
              ›
            </span>
          </button>
        ))}
        <button type="button" className={styles.groupRow} onClick={() => setSheet({ kind: 'connect' })}>
          <span className={styles.rowName}>{t('agents.mobile.connectAnAgent')}</span>
          <span className={styles.chevron} aria-hidden>
            ›
          </span>
        </button>
      </div>

      {first && (
        <>
          <span className={styles.groupLabel}>{t('agents.nav.permissions')}</span>
          <div className={styles.group}>
            {AGENT_PERMISSIONS.map((permission: AgentPermission) => (
              <button
                key={permission}
                type="button"
                className={styles.groupRow}
                onClick={() => setSheet({ kind: 'agent', id: first.id })}
              >
                <span className={styles.rowName}>{t(`agents.permissions.${permission}.name`)}</span>
                <span className={styles.rowState}>
                  {first.permissions.includes(permission) ? t('agents.permissions.allow') : t('agents.permissions.off')}{' '}
                  ›
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.group}>
        <button type="button" className={styles.groupRow} onClick={() => setSheet({ kind: 'activity' })}>
          <span className={styles.rowName}>{t('agents.activity.title')}</span>
          <span className={styles.chevron} aria-hidden>
            ›
          </span>
        </button>
      </div>

      <SidePanel
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={
          sheetAgent?.name ??
          (sheet?.kind === 'activity' ? t('agents.activity.title') : t('agents.mobile.connectAnAgent'))
        }
      >
        <div className={styles.sheet}>
          {sheetAgent && (
            <AgentPermissions
              agent={sheetAgent}
              onRevoke={(agent) => {
                setSheet(null);
                onRevoke(agent);
              }}
            />
          )}
          {sheet?.kind === 'connect' && (
            <ConnectAgent serverUrl={data?.serverUrl ?? null} enabled={data?.enabled ?? true} />
          )}
          {sheet?.kind === 'activity' && <AgentActivity embedded />}
        </div>
      </SidePanel>
    </div>
  );
}
