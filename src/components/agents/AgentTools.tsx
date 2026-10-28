import { useTranslation } from 'react-i18next';
import styles from './agents.module.css';

const TOOLS = [
  'list_boards',
  'list_tasks',
  'get_task',
  'create_task',
  'update_task',
  'move_task',
  'complete_task',
  'delete_task',
  'get_triage',
  'triage_task',
  'get_stats',
] as const;

/** For developers: the MCP tools the server exposes. */
export function AgentTools() {
  const { t } = useTranslation();
  return (
    <section className={[styles.card, styles.cardMuted].join(' ')}>
      <div className={styles.headingRow}>
        <h2 className={styles.titleSmall}>{t('agents.tools.title')}</h2>
        <span className={styles.meta}>{t('agents.tools.forDevelopers')}</span>
      </div>
      <dl className={styles.tools}>
        {TOOLS.map((tool) => (
          <div key={tool} className={styles.tool}>
            <dt className={styles.toolName}>{tool}</dt>
            <dd className={styles.meta}>{t(`agents.tools.${tool}`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
