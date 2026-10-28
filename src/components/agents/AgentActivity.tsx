import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentActivity } from '../../hooks/useAgents';
import { agentTimeLabel } from '../../lib/agents';
import { AgentAvatar } from './AgentAvatar';
import type { AgentActivityEntry } from '../../models';
import styles from './agents.module.css';

const PREVIEW_COUNT = 5;

function ActivityLine({ entry, locale }: { entry: AgentActivityEntry; locale: string }) {
  const { t } = useTranslation();
  // The detail of an edit is a list of field names; the others read naturally after the title.
  const detail = entry.kind === 'edited' ? null : entry.detail;
  return (
    <li className={styles.activityRow}>
      <AgentAvatar name={entry.agentName} />
      <div className={styles.agentText}>
        <span className={styles.activityText}>
          {entry.agentName} {t(`agents.activity.${entry.kind}`, { count: entry.tasks.length })}
          {entry.tasks.length > 1 && ':'}
          {entry.tasks.length > 0 && ' '}
          {entry.tasks.map((task, i) => (
            <span key={task.id ?? i}>
              {i > 0 && ', '}
              <b>{task.title}</b>
            </span>
          ))}
          {detail && <span> {detail}</span>}
        </span>
        <span className={styles.meta}>{agentTimeLabel(entry.createdAt, locale, t('agents.activity.yesterday'))}</span>
      </div>
    </li>
  );
}

/** What agents changed (and read), newest first. */
export function AgentActivity({ embedded = false }: { embedded?: boolean }) {
  const { t, i18n } = useTranslation();
  const { data } = useAgentActivity();
  const [all, setAll] = useState(false);
  const entries = data ?? [];
  const visible = all ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <section id="activity" className={embedded ? styles.embedded : styles.card}>
      <div className={styles.headingRow} hidden={embedded}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{t('agents.activity.title')}</h2>
          <p className={styles.hint}>{t('agents.activity.hint')}</p>
        </div>
        {entries.length > PREVIEW_COUNT && (
          <button type="button" className={styles.linkButton} onClick={() => setAll((v) => !v)}>
            {all ? t('agents.activity.showLess') : t('agents.activity.seeAll')}
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className={styles.hint}>{t('agents.activity.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((entry) => (
            <ActivityLine key={entry.id} entry={entry} locale={i18n.language} />
          ))}
        </ul>
      )}
    </section>
  );
}
