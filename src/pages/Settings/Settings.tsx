import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import { useAuth0 } from '@auth0/auth0-react';
import { LifeAreasManager } from '../../components/lifeAreas';
import { BoardsManager } from '../../components/board';
import { FeedbackButton } from '../../components/feedback';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { useBoards, useClearAvatar, useMyAvatarKey, useSetAvatar } from '../../hooks/useBoards';
import { FilePickButton, SegmentedTabs, toast } from '../../components/ui';
import { imageUrl } from '../../lib/images';
import { getSamoyedMode, SAMOYED_MODES, setSamoyedMode, type SamoyedMode } from '../../lib/samoyed';
import { MAX_LIFE_AREAS } from '../../lib/lifeAreas';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import { SettingsShell, type SettingsSection } from './SettingsShell';
import styles from './Settings.module.css';

const THEMES: ThemeName[] = ['powder', 'glamour'];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth0();
  const { theme, setTheme } = useTheme();
  const { data: areas } = useLifeAreas();
  const { data: boards } = useBoards();
  const avatarKey = useMyAvatarKey();
  const setAvatar = useSetAvatar();
  const clearAvatar = useClearAvatar();
  const [samoyedMode, setSamoyedModeState] = useState(getSamoyedMode);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const closeAvatarMenu = useCallback(() => setAvatarMenuOpen(false), []);
  useOutsideClick(avatarMenuRef, closeAvatarMenu);

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
            <span className={styles.cardTitle}>{t('settings.language')}</span>
            <SegmentedTabs
              value={i18n.resolvedLanguage ?? 'en'}
              onChange={(lng) => void i18n.changeLanguage(lng)}
              options={LANGUAGES.map((lng) => ({ value: lng, label: t(`language.${lng}`) }))}
            />
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
            <p className={styles.cardHint}>{t(`samoyed.modeHint.${samoyedMode}`)}</p>
          </div>
        </section>
      </div>

      <section id="account" className={[styles.card, styles.account].join(' ')}>
        <div className={styles.accountInfo}>
          <div ref={avatarMenuRef} className={styles.avatarMenuWrap}>
            <button
              type="button"
              className={styles.avatarButton}
              aria-label={t(avatarKey ? 'settings.changeAvatar' : 'settings.addAvatar')}
              aria-haspopup="menu"
              aria-expanded={avatarMenuOpen}
              onClick={() => setAvatarMenuOpen((v) => !v)}
            >
              {avatarKey || user?.picture ? (
                <img className={styles.avatar} src={avatarKey ? imageUrl(avatarKey) : user?.picture} alt="" />
              ) : (
                <div className={styles.avatar} />
              )}
            </button>
            {avatarMenuOpen && (
              <div className={styles.avatarMenu} role="menu">
                <FilePickButton
                  disabled={setAvatar.isPending}
                  onFile={(file) => {
                    closeAvatarMenu();
                    setAvatar.mutate(file, {
                      onSuccess: () => toast.show(t('settings.avatarUpdated')),
                      onError: () => toast.show(t('board.actionFailed')),
                    });
                  }}
                >
                  {t(avatarKey ? 'settings.changeAvatar' : 'settings.addAvatar')}
                </FilePickButton>
                {avatarKey && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.logout}
                    onClick={() => {
                      closeAvatarMenu();
                      clearAvatar.mutate();
                    }}
                  >
                    {t('settings.removeAvatar')}
                  </button>
                )}
              </div>
            )}
          </div>
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
