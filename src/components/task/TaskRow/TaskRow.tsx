import type { PointerEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import { Chip } from '../../ui/Chip';
import { SwipeActions, type SwipeAction } from '../../ui/SwipeActions';
import { DragHandle } from '../DragHandle';
import { MetaChip } from '../MetaChip';
import { RecurrenceIcon } from '../RecurrenceIcon';
import { AssigneeChip } from '../../board';
import { dueUrgency, type DueUrgency } from '../../../lib/taskDates';
import { htmlToText } from '../../../lib/richText';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { useTaskFormState } from '../taskFormStore';
import { openOnRowClick } from '../openOnRowClick';
import type { Task } from '../../../models';
import { useIsLeaving } from '../taskLeavingStore';
import styles from './TaskRow.module.css';

interface DragHandleProps {
  dragging: boolean;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
}

interface TaskRowProps {
  task: Task;
  done?: boolean;
  onToggle?: () => void;
  /** Makes the row clickable: opens the task's details. */
  onOpen?: () => void;
  /** The row's secondary action (e.g. → Today), shown at the end of the row. */
  trailing?: ReactNode;
  /** Touch swipe actions: `left` = swipe left, `right` = swipe right. Skipped while drag-reordering. */
  swipe?: { left?: SwipeAction; right?: SwipeAction };
  showChips?: boolean;
  /** Desktop: the chips share one centred line with the title (Backlog) instead of sitting under it. */
  inline?: boolean;
  rowRef?: (el: HTMLDivElement | null) => void;
  dragHandleProps?: DragHandleProps;
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

export function TaskRow({
  task,
  done = false,
  onToggle,
  onOpen,
  trailing,
  swipe,
  showChips = true,
  inline = false,
  rowRef,
  dragHandleProps,
}: TaskRowProps) {
  const { t } = useTranslation();
  const leaving = useIsLeaving(task.id);
  const areas = useLifeAreaLookup();
  // Highlight the row whose details are open in the side panel (mockup 03).
  const selected = useTaskFormState().task?.id === task.id;
  const urgency = dueUrgency(task);
  const areaName = task.areaId ? areas.get(task.areaId)?.name : undefined;
  const hasChips = showChips && (urgency || task.priority || task.energy || task.estimatedMinutes != null || areaName);
  const swiped = swipe && !dragHandleProps;
  const onClick = openOnRowClick(onOpen);
  const rowClassName = [
    styles.row,
    inline && styles.inline,
    !hasChips && styles.noChips,
    onOpen && styles.clickable,
    urgency && styles.dueSoon,
    selected && styles.selected,
    dragHandleProps?.dragging && styles.dragging,
    leaving && styles.leaving,
  ]
    .filter(Boolean)
    .join(' ');

  const row = (
    <div ref={rowRef} className={rowClassName} onClick={swiped ? undefined : onClick}>
      <div className={styles.lead}>
        {dragHandleProps && (
          <DragHandle
            label={t('task.reorder', { title: task.title })}
            dragging={dragHandleProps.dragging}
            onPointerDown={dragHandleProps.onPointerDown}
          />
        )}
        {onToggle && <Checkbox checked={false} onChange={onToggle} label={t('task.markDone', { title: task.title })} />}
      </div>
      <div className={styles.body}>
        <span className={done ? `${styles.title} ${styles.done}` : styles.title}>
          {onOpen ? (
            <button type="button" className={styles.titleButton} onClick={onOpen}>
              {task.title}
            </button>
          ) : (
            task.title
          )}
          <RecurrenceIcon task={task} />
        </span>
        {task.description && <span className={styles.description}>{htmlToText(task.description)}</span>}
      </div>
      {hasChips && (
        <div className={styles.chips}>
          {urgency && <Chip variant="danger">{t(dueLabelKey(urgency))}</Chip>}
          {task.priority && <MetaChip axis="priority" value={task.priority} />}
          {task.energy && <MetaChip axis="energy" value={task.energy} />}
          {task.estimatedMinutes != null && <MetaChip axis="effort" minutes={task.estimatedMinutes} />}
          {areaName && <Chip>{areaName}</Chip>}
        </div>
      )}
      <div className={styles.assignee}>
        <AssigneeChip task={task} />
      </div>
      {trailing && <div className={styles.action}>{trailing}</div>}
    </div>
  );

  return swiped ? (
    <SwipeActions {...swipe} onClick={onClick}>
      {row}
    </SwipeActions>
  ) : (
    row
  );
}
