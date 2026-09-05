import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import { Chip } from '../../ui/Chip';
import { EditButton } from '../EditButton';
import { MetaChip } from '../MetaChip';
import { RecurrenceIcon } from '../RecurrenceIcon';
import { dueUrgency, type DueUrgency } from '../../../lib/taskDates';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import type { Task } from '../../../models';
import styles from './TaskRow.module.css';

interface TaskRowProps {
  task: Task;
  done?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  trailing?: ReactNode;
  showChips?: boolean;
}

function dueLabelKey(urgency: DueUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'task.dueOverdue';
    case 'today':
      return 'task.dueToday';
    case 'tomorrow':
      return 'task.dueTomorrow';
  }
}

export function TaskRow({ task, done = false, onToggle, onEdit, trailing, showChips = true }: TaskRowProps) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const urgency = dueUrgency(task);
  const areaName = task.areaId ? areas.get(task.areaId)?.name : undefined;
  const hasChips = showChips && (urgency || task.priority || task.energy || task.estimatedMinutes != null || areaName);

  return (
    <div className={urgency ? `${styles.row} ${styles.dueSoon}` : styles.row}>
      <div className={styles.main}>
        {onToggle && <Checkbox checked={false} onChange={onToggle} label={t('task.markDone', { title: task.title })} />}
        <div className={styles.body}>
          <span className={done ? `${styles.title} ${styles.done}` : styles.title}>
            {task.title}
            <RecurrenceIcon recurrence={task.recurrence} />
          </span>
          {task.description && <span className={styles.description}>{task.description}</span>}
        </div>
      </div>
      {onEdit && <EditButton title={task.title} onClick={onEdit} />}
      {trailing}
      {hasChips && (
        <div className={styles.chips}>
          {urgency && <Chip variant="danger">{t(dueLabelKey(urgency))}</Chip>}
          {task.priority && <MetaChip axis="priority" value={task.priority} />}
          {task.energy && <MetaChip axis="energy" value={task.energy} />}
          {task.estimatedMinutes != null && <MetaChip axis="effort" minutes={task.estimatedMinutes} />}
          {areaName && <Chip>{areaName}</Chip>}
        </div>
      )}
    </div>
  );
}
