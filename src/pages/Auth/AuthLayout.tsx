import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AuthLayout.module.css';

/** Split-panel shell from mockup 01: product-preview marketing panel + a slot for the sign-in form. */
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
          <div className={styles.preview} aria-hidden="true">
            <div className={styles.todayCard}>
              <span className={styles.cardTitle}>{t('nav.today')}</span>
              <div className={styles.previewRow}>
                <span className={styles.box} />
                <span className={styles.rowTitle}>{t('auth.preview.taxes')}</span>
                <span className={styles.chipP1}>P1</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.box} />
                <span className={styles.rowTitle}>{t('auth.preview.dentist')}</span>
                <span className={styles.chipDue}>{t('task.dueToday')}</span>
              </div>
              <div className={`${styles.previewRow} ${styles.previewDone}`}>
                <span className={`${styles.box} ${styles.boxDone}`} />
                <span className={styles.rowTitle}>{t('auth.preview.gym')}</span>
              </div>
            </div>
            <div className={styles.triageCard}>
              <span className={styles.chipDue}>{t('auth.preview.fromYesterday')}</span>
              <span className={styles.triageTitle}>{t('auth.preview.bike')}</span>
              <div className={styles.triageActions}>
                <span className={styles.triageToday}>{t('nav.today')}</span>
                <span className={styles.triageBacklog}>{t('nav.backlog')}</span>
              </div>
            </div>
          </div>
          <div className={styles.pitch}>
            <h1 className={styles.headline}>{t('auth.headline')}</h1>
            <p className={styles.blurb}>{t('auth.blurb')}</p>
          </div>
        </aside>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
}
