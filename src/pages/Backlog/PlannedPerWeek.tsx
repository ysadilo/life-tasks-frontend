import { useTranslation } from 'react-i18next';
import { SectionLabel } from '../../components/ui';
import { weekBucket } from '../../lib/taskGrouping';
import type { Task } from '../../models';
import styles from './PlannedPerWeek.module.css';

const PLANNED_WEEKS = ['thisWeek', 'nextWeek', 'later'] as const;

/** Rail card: how many backlog tasks are planned for this week, next week and later, as bars. */
export function PlannedPerWeek({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();
  const rows = PLANNED_WEEKS.map((key) => ({ key, count: tasks.filter((task) => weekBucket(task) === key).length }));
  const max = Math.max(...rows.map((row) => row.count));
  if (max === 0) return null;

  return (
    <section className={styles.planned}>
      <SectionLabel>{t('backlog.plannedPerWeek')}</SectionLabel>
      {rows.map(({ key, count }) => (
        <div key={key} className={styles.week}>
          <div className={styles.weekLine}>
            <span>{t(`backlog.group.${key}`)}</span>
            <span className={styles.count}>{count}</span>
          </div>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}
