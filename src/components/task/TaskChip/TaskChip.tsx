import { useTranslation } from 'react-i18next';
import { startOfDay } from '../../../lib/dateUtils';
import type { Task } from '../../../models';
import styles from './TaskChip.module.css';

interface TaskChipProps {
  task: Task;
}

export function TaskChip({ task }: TaskChipProps) {
  const { t } = useTranslation();
  const done = task.status === 'done';
  const overdue = !done && task.dueDate != null && startOfDay(new Date(task.dueDate)) < startOfDay(new Date());

  const classes = [styles.chip, overdue ? styles.overdue : '', done ? styles.done : ''].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {overdue && <span className={styles.overdueLabel}>{t('calendar.overdue')}</span>}
      <span className={styles.title}>{task.title}</span>
    </div>
  );
}
