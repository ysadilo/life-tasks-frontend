import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, SegmentedTabs, toast } from '../ui';
import { AGENT_CLIENTS, mcpConfigJson, type AgentClient } from '../../lib/agents';
import styles from './agents.module.css';

const STEP_COUNT = 3;

/** How to add the Life Tasks MCP server to an assistant; the sign-in itself is OAuth, so no secret is shown. */
export function ConnectAgent({ serverUrl }: { serverUrl: string | null }) {
  const { t } = useTranslation();
  const [client, setClient] = useState<AgentClient>('claude');

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
    <section id="agents" className={styles.card}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{t('agents.connect.title')}</h2>
        <p className={styles.hint}>{t('agents.connect.intro')}</p>
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
            <Button onClick={copy}>{t('agents.connect.copy')}</Button>
          </div>
        ) : (
          <p className={styles.hint}>{t('agents.connect.notConfigured')}</p>
        )}
        <p className={styles.note}>{t('agents.connect.oauthNote')}</p>
      </div>

      <div className={styles.block}>
        <span className={styles.label}>{t('agents.connect.connectAnAgent')}</span>
        <SegmentedTabs
          value={client}
          onChange={(value) => setClient(value as AgentClient)}
          options={AGENT_CLIENTS.map((c) => ({ value: c, label: t(`agents.connect.client.${c}`) }))}
        />
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
