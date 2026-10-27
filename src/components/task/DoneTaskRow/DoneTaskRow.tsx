import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import { PillButton } from '../../ui/PillButton';
import { MemberAvatar } from '../../board';
import { useBoardMembers } from '../../../hooks/useBoards';
import { openOnRowClick } from '../openOnRowClick';
import { RecurrenceIcon } from '../RecurrenceIcon';
import type { Task } from '../../../models';
import styles from './DoneTaskRow.module.css';

interface DoneTaskRowProps {
  task: Task;
  onToggle?: () => void;
  /** Makes the row clickable: opens the task's details. */
  onOpen?: () => void;
  /** Shows a Reflect pill that opens the check-in for this finished task. */
  onReflect?: () => void;
}

function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DoneTaskRow({ task, onToggle, onOpen, onReflect }: DoneTaskRowProps) {
  const { t } = useTranslation();
  const time = formatTime(task.completedAt);
  // Read-only: who it was assigned to (shared boards only); reassigning happens on open tasks.
  const { byId } = useBoardMembers();
  const assignee = task.assigneeId ? byId.get(task.assigneeId) : undefined;

  return (
    <div className={onOpen ? `${styles.row} ${styles.clickable}` : styles.row} onClick={openOnRowClick(onOpen)}>
      <Checkbox checked onChange={onToggle} label={t('task.markNotDone', { title: task.title })} />
      <span className={styles.titleWrap}>
        {onOpen ? (
          <button type="button" className={`${styles.title} ${styles.titleButton}`} onClick={onOpen}>
            {task.title}
          </button>
        ) : (
          <span className={styles.title}>{task.title}</span>
        )}
        <RecurrenceIcon task={task} />
      </span>
      {assignee && <MemberAvatar email={assignee.email} />}
      {time && <span className={styles.time}>{time}</span>}
      {onReflect && <PillButton onClick={onReflect}>{t('task.reflect')}</PillButton>}
    </div>
  );
}
