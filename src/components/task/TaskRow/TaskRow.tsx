import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import { Chip } from '../../ui/Chip';
import { priorityVariant } from '../../../lib/priority';
import type { Task } from '../../../models';
import styles from './TaskRow.module.css';

interface TaskRowProps {
  task: Task;
  onToggle?: () => void;
  trailing?: ReactNode;
  showChips?: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h ${minutes % 60}m`;
}

export function TaskRow({ task, onToggle, trailing, showChips = true }: TaskRowProps) {
  const { t } = useTranslation();
  const hasChips = showChips && (task.priority || task.estimatedMinutes != null || task.area);

  return (
    <div className={styles.row}>
      <Checkbox checked={false} onChange={onToggle} label={t('task.markDone', { title: task.title })} />
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        {task.description && <span className={styles.description}>{task.description}</span>}
      </div>
      {trailing}
      {hasChips && (
        <div className={styles.chips}>
          {task.priority && <Chip variant={priorityVariant(task.priority)}>{task.priority}</Chip>}
          {task.estimatedMinutes != null && <Chip>{formatMinutes(task.estimatedMinutes)}</Chip>}
          {task.area && <Chip>{t(`lifeArea.${task.area}`)}</Chip>}
        </div>
      )}
    </div>
  );
}
