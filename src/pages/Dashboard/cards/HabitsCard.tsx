import { useTranslation } from 'react-i18next';
import type { Habit } from '../../../lib/insights';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

export function HabitsCard({ habits }: { habits: Habit[] }) {
  const { t } = useTranslation();
  return (
    <InsightCard infoKey="habits" title={t('dashboard.habits.title')} subtitle={t('dashboard.habits.subtitle')}>
      {habits.length === 0 ? (
        <span className={styles.empty}>{t('dashboard.habits.empty')}</span>
      ) : (
        <div className={styles.list}>
          {habits.map((h) => (
            <div key={h.id} className={styles.habit}>
              <span className={[styles.habitBadge, h.atRisk ? styles.habitBadgeRisk : ''].join(' ')}>{h.streak}×</span>
              {h.title}
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  );
}
