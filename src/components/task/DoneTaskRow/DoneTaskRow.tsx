import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import type { Task } from '../../../models';
import styles from './DoneTaskRow.module.css';

interface DoneTaskRowProps {
  task: Task;
  onToggle?: () => void;
}

function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DoneTaskRow({ task, onToggle }: DoneTaskRowProps) {
  const { t } = useTranslation();
  const time = formatTime(task.completedAt);

  return (
    <div className={styles.row}>
      <Checkbox checked onChange={onToggle} label={t('task.markNotDone', { title: task.title })} />
      <span className={styles.title}>{task.title}</span>
      {time && <span className={styles.time}>{time}</span>}
    </div>
  );
}
