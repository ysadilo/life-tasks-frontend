import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AuthLayout.module.css';

const PILL_KEYS = ['pwa', 'offline', 'family'] as const;

/** Split-panel shell from mockup 01: gold marketing panel + a slot for the Clerk widget. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <aside className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoMark} />
            <span className={styles.logoText}>{t('app.name')}</span>
          </div>
          <div className={styles.pitch}>
            <h1 className={styles.headline}>{t('auth.headline')}</h1>
            <p className={styles.blurb}>{t('auth.blurb')}</p>
          </div>
          <ul className={styles.pills}>
            {PILL_KEYS.map((key) => (
              <li key={key} className={styles.pill}>
                {t(`auth.pill.${key}`)}
              </li>
            ))}
          </ul>
        </aside>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
}
