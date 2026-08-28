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
  onEdit?: () => void;
  trailing?: ReactNode;
  showChips?: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h ${minutes % 60}m`;
}

export function TaskRow({ task, onToggle, onEdit, trailing, showChips = true }: TaskRowProps) {
  const { t } = useTranslation();
  const hasChips = showChips && (task.priority || task.estimatedMinutes != null || task.area);

  return (
    <div className={styles.row}>
      {onToggle && <Checkbox checked={false} onChange={onToggle} label={t('task.markDone', { title: task.title })} />}
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        {task.description && <span className={styles.description}>{task.description}</span>}
      </div>
      {onEdit && (
        <button
          type="button"
          className={styles.edit}
          onClick={onEdit}
          aria-label={t('task.edit', { title: task.title })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
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
