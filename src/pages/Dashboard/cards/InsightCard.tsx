import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoPopover } from '../../../components/ui';
import styles from '../Dashboard.module.css';

const SPAN = { 1: styles.span1, 2: styles.span2, 4: styles.span4 } as const;

interface InsightCardProps {
  title: string;
  subtitle: string;
  /** Copy lives at `dashboard.<infoKey>.info.shows` / `.counted`. */
  infoKey: string;
  span?: keyof typeof SPAN;
  /** Right-aligned header content (e.g. a legend). */
  aside?: ReactNode;
  children: ReactNode;
}

export function InsightCard({ title, subtitle, infoKey, span = 1, aside, children }: InsightCardProps) {
  const { t } = useTranslation();
  return (
    <section className={[styles.card, SPAN[span]].join(' ')}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitles}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>{title}</h2>
            <InfoPopover
              label={t('dashboard.infoLabels.about', { title })}
              shows={{ heading: t('dashboard.infoLabels.shows'), text: t(`dashboard.${infoKey}.info.shows`) }}
              counted={{ heading: t('dashboard.infoLabels.counted'), text: t(`dashboard.${infoKey}.info.counted`) }}
              dismissLabel={t('dashboard.infoLabels.dismiss')}
            />
          </div>
          <span className={styles.cardSubtitle}>{subtitle}</span>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
