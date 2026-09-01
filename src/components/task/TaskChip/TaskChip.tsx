import { useTranslation } from 'react-i18next';
import { isOverdue } from '../../../lib/taskDates';
import type { Task } from '../../../models';
import styles from './TaskChip.module.css';

interface TaskChipProps {
  task: Task;
  /** Overrides `task.status` — a recurring occurrence is done per-day, not per-series. */
  done?: boolean;
  onClick?: () => void;
}

export function TaskChip({ task, done: doneProp, onClick }: TaskChipProps) {
  const { t } = useTranslation();
  const done = doneProp ?? task.status === 'done';
  const overdue = !done && isOverdue(task);

  const classes = [styles.chip, onClick ? styles.clickable : '', overdue ? styles.overdue : '', done ? styles.done : '']
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {overdue && <span className={styles.overdueLabel}>{t('calendar.overdue')}</span>}
      <span className={styles.title}>{task.title}</span>
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
