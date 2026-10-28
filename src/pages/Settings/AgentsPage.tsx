import { useTranslation } from 'react-i18next';
import { AgentsSettings } from '../../components/agents';
import { SettingsShell, type SettingsSection } from './SettingsShell';
import styles from './Settings.module.css';

/** Settings › AI agents: its own page, with its own "On this page" index. */
export default function AgentsPage() {
  const { t } = useTranslation();
  const sections: SettingsSection[] = ['connect', 'connected', 'permissions', 'activity'].map((id) => ({
    id,
    label: t(`agents.nav.${id}`),
  }));

  return (
    <SettingsShell page="agents" sections={sections} title={t('agents.title')}>
      <header className={styles.pageHeading}>
        <h2 className={styles.pageTitle}>{t('agents.title')}</h2>
        <p className={styles.pageSubtitle}>{t('agents.subtitle')}</p>
      </header>
      <AgentsSettings />
    </SettingsShell>
  );
}
