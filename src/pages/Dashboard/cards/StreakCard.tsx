import { useTranslation } from 'react-i18next';
import type { StreakInsight } from '../../../lib/insights';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

export function StreakCard({ streak }: { streak: StreakInsight }) {
  const { t } = useTranslation();
  return (
    <InsightCard infoKey="streak" title={t('dashboard.streak.title')} subtitle={t('dashboard.streak.subtitle')}>
      <div className={styles.big}>
        <span className={styles.bigNumber}>{streak.current}</span>
        {t('dashboard.streak.caption', { best: streak.best })}
      </div>
      <div className={styles.streakDots}>
        {streak.last14.map(({ day, done }) => (
          <span
            key={day.getTime()}
            className={[styles.streakDot, done ? styles.streakDotOn : ''].join(' ')}
            title={day.toLocaleDateString()}
          />
        ))}
      </div>
    </InsightCard>
  );
}
