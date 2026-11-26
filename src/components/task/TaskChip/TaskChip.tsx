import { useTranslation } from 'react-i18next';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { isOverdue } from '../../../lib/taskDates';
import type { Task } from '../../../models';
import styles from './TaskChip.module.css';

interface TaskChipProps {
  task: Task;
  /** Overrides `task.status` — a recurring occurrence is done per-day, not per-series. */
  done?: boolean;
  /** Time of day shown beside the area dot; "Any time" when absent. */
  time?: string | null;
  onClick?: () => void;
}

/** Calendar card (v7 week view): title, then the area dot and the time. */
export function TaskChip({ task, done: doneProp, time, onClick }: TaskChipProps) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const done = doneProp ?? task.status === 'done';
  const overdue = !done && isOverdue(task);
  const area = task.areaId ? areas.get(task.areaId) : undefined;

  const classes = [styles.chip, onClick ? styles.clickable : '', done ? styles.done : ''].filter(Boolean).join(' ');

  const content = (
    <>
      {overdue && <span className={styles.overdueLabel}>{t('calendar.overdue')}</span>}
      <span className={styles.title}>{task.title}</span>
      <span className={styles.meta}>
        {area && (
          <span
            className={styles.areaDot}
            style={{ background: lifeAreaColorVar(area.order) }}
            title={area.name}
            aria-label={area.name}
            role="img"
          />
        )}
        {time ?? t('calendar.anyTime')}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
