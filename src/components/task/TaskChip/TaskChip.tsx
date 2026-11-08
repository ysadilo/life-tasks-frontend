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
  /** One-line pill (month cells) instead of the card with its area line (week columns). */
  compact?: boolean;
  onClick?: () => void;
}

export function TaskChip({ task, done: doneProp, compact = false, onClick }: TaskChipProps) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const done = doneProp ?? task.status === 'done';
  const overdue = !done && isOverdue(task);
  const area = task.areaId ? areas.get(task.areaId) : undefined;

  const classes = [compact ? styles.pill : styles.chip, onClick ? styles.clickable : '', done ? styles.done : '']
    .filter(Boolean)
    .join(' ');

  const content = compact ? (
    <span className={styles.title}>{task.title}</span>
  ) : (
    <>
      {overdue && <span className={styles.overdueLabel}>{t('calendar.overdue')}</span>}
      <span className={styles.title}>{task.title}</span>
      {(area || task.recurrence) && (
        <span className={styles.meta}>
          {area && <span className={styles.areaDot} style={{ background: lifeAreaColorVar(area.order) }} />}
          {[area?.name, task.recurrence && '↻'].filter(Boolean).join(' · ')}
        </span>
      )}
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
