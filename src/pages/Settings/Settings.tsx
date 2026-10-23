import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { PageHeader } from '../../components/layout';
import { LifeAreasManager } from '../../components/lifeAreas';
import { Button } from '../../components/ui';
import { useTheme, type ThemeName } from '../../theme/ThemeProvider';
import styles from './Settings.module.css';

const THEMES: ThemeName[] = ['powder', 'glamour'];

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth0();
  const { theme, setTheme } = useTheme();

  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');

  return (
    <div className={styles.page}>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className={styles.sections}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('sidebar.lifeAreas')}</h2>
          <LifeAreasManager />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('settings.appearance')}</h2>
          <p className={styles.cardHint}>{t('settings.appearanceHint')}</p>
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
        </section>

        <section className={[styles.card, styles.account].join(' ')}>
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
          <Button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            {t('auth.signOut')}
          </Button>
        </section>
      </div>
    </div>
  );
}
