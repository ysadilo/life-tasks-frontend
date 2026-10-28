import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { LifeAreasManager } from '../../components/lifeAreas';
import { BoardsManager } from '../../components/board';
import { FeedbackButton } from '../../components/feedback';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { useBoards } from '../../hooks/useBoards';
import { SegmentedTabs } from '../../components/ui';
import { getSamoyedMode, SAMOYED_MODES, setSamoyedMode, type SamoyedMode } from '../../lib/samoyed';
import { MAX_LIFE_AREAS } from '../../lib/lifeAreas';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import { SettingsShell, type SettingsSection } from './SettingsShell';
import styles from './Settings.module.css';

const THEMES: ThemeName[] = ['powder', 'glamour'];

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth0();
  const { theme, setTheme } = useTheme();
  const { data: areas } = useLifeAreas();
  const { data: boards } = useBoards();
  const [samoyedMode, setSamoyedModeState] = useState(getSamoyedMode);

  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');

  const sections: SettingsSection[] = [
    {
      id: 'lifeAreas',
      label: t('settings.nav.lifeAreas'),
      meta: areas ? `${areas.length}/${MAX_LIFE_AREAS}` : undefined,
    },
    { id: 'boards', label: t('settings.nav.boards'), meta: boards ? String(boards.length) : undefined },
    { id: 'appearance', label: t('settings.nav.appearance'), meta: t(`theme.${theme}`) },
    { id: 'account', label: t('settings.nav.account') },
  ];

  return (
    <SettingsShell page="general" sections={sections} title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <section id="lifeAreas" className={styles.card}>
        <h2 className={styles.cardTitle}>{t('sidebar.lifeAreas')}</h2>
        <LifeAreasManager />
      </section>

      <div className={styles.grid}>
        <section id="boards" className={styles.card}>
          <div className={styles.cardHeading}>
            <h2 className={styles.cardTitle}>{t('board.boards')}</h2>
            <p className={styles.cardHint}>{t('settings.boardsHint')}</p>
          </div>
          <BoardsManager />
        </section>

        <section id="appearance" className={styles.card}>
          <div className={styles.cardHeading}>
            <h2 className={styles.cardTitle}>{t('settings.appearance')}</h2>
            <p className={styles.cardHint}>{t('settings.appearanceHint')}</p>
          </div>
          <div className={styles.themes}>
            {THEMES.map((name) => (
              <button
                key={name}
                type="button"
                className={[styles.theme, name === theme ? styles.themeActive : ''].filter(Boolean).join(' ')}
                aria-pressed={name === theme}
                onClick={() => setTheme(name)}
              >
                <span className={styles.preview} data-theme={name}>
                  <span />
                  <span />
                  <span />
                </span>
                {t(`theme.${name}`)}
              </button>
            ))}
          </div>
          <div className={styles.samoyed}>
            <span className={styles.cardTitle}>{t('samoyed.setting')}</span>
            <SegmentedTabs
              value={samoyedMode}
              onChange={(mode) => {
                setSamoyedMode(mode as SamoyedMode);
                setSamoyedModeState(mode as SamoyedMode);
              }}
              options={SAMOYED_MODES.map((mode) => ({ value: mode, label: t(`samoyed.mode.${mode}`) }))}
            />
            <p className={styles.cardHint}>{t('samoyed.settingHint')}</p>
          </div>
        </section>
      </div>

      <section id="account" className={[styles.card, styles.account].join(' ')}>
        <div className={styles.accountInfo}>
          {user?.picture ? (
            <img className={styles.avatar} src={user.picture} alt="" />
          ) : (
            <div className={styles.avatar} />
          )}
          <div className={styles.accountText}>
            <span className={styles.accountName}>{displayName}</span>
            {user?.email && <span className={styles.accountEmail}>{user.email}</span>}
          </div>
        </div>
        <div className={styles.accountActions}>
          <FeedbackButton />
          <button
            type="button"
            className={styles.logout}
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            {t('auth.signOut')}
          </button>
        </div>
      </section>
    </SettingsShell>
  );
}
