import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, toast } from '../ui';
import { useSetAgentsEnabled } from '../../hooks/useAgents';
import { AGENT_CLIENTS, mcpConfigJson, type AgentClient } from '../../lib/agents';
import styles from './agents.module.css';

const STEP_COUNT = 3;

interface ConnectAgentProps {
  serverUrl: string | null;
  enabled: boolean;
}

/** How to add the Life Tasks MCP server to an assistant; the sign-in itself is OAuth, so no secret is shown. */
export function ConnectAgent({ serverUrl, enabled }: ConnectAgentProps) {
  const { t } = useTranslation();
  const [client, setClient] = useState<AgentClient>('claude');
  const setEnabled = useSetAgentsEnabled();

  const copy = async () => {
    if (!serverUrl) return;
    try {
      await navigator.clipboard.writeText(serverUrl);
      toast.show(t('agents.connect.copied'));
    } catch {
      toast.show(t('agents.connect.copyFailed'));
    }
  };

  return (
    <section id="connect" className={styles.card}>
      <div className={styles.headingRow}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{t('agents.connect.title')}</h2>
          <p className={styles.hint}>{enabled ? t('agents.connect.intro') : t('agents.connect.paused')}</p>
        </div>
        <Switch checked={enabled} onChange={(on) => setEnabled.mutate(on)} label={t('agents.connect.allowAgents')} />
      </div>

      <div className={styles.block}>
        <span className={styles.label}>{t('agents.connect.serverLabel')}</span>
        {serverUrl ? (
          <div className={styles.urlRow}>
            <input
              className={styles.url}
              readOnly
              value={serverUrl}
              aria-label={t('agents.connect.serverLabel')}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className={styles.pillButton} onClick={copy}>
              {t('agents.connect.copy')}
            </button>
          </div>
        ) : (
          <p className={styles.hint}>{t('agents.connect.notConfigured')}</p>
        )}
        <p className={styles.note}>{t('agents.connect.oauthNote')}</p>
      </div>

      <div className={styles.block}>
        <span className={styles.label}>{t('agents.connect.connectAnAgent')}</span>
        <div className={styles.pills} role="group" aria-label={t('agents.connect.connectAnAgent')}>
          {AGENT_CLIENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={c === client}
              className={[styles.pill, c === client ? styles.pillActive : ''].filter(Boolean).join(' ')}
              onClick={() => setClient(c)}
            >
              {t(`agents.connect.client.${c}`)}
            </button>
          ))}
        </div>
        <ol className={styles.steps}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <span>{t(`agents.connect.steps.${client}.${i + 1}`)}</span>
            </li>
          ))}
        </ol>
        {serverUrl && (
          <details className={styles.details}>
            <summary>{t('agents.connect.configFile')}</summary>
            <pre className={styles.code}>{mcpConfigJson(serverUrl)}</pre>
          </details>
        )}
      </div>
    </section>
  );
}
