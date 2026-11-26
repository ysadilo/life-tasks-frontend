import type { PointerEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../ui/Checkbox';
import { Chip } from '../../ui/Chip';
import { SwipeActions, type SwipeAction } from '../../ui/SwipeActions';
import { DragHandle } from '../DragHandle';
import { MetaChip } from '../MetaChip';
import { ReminderIcon } from '../ReminderIcon';
import { AssigneeChip } from '../../board';
import { dueUrgency, type DueUrgency } from '../../../lib/taskDates';
import { htmlToText } from '../../../lib/richText';
import { recurrenceLabel } from '../../../lib/recurrence';
import { hasReminder, reminderLabel } from '../../../lib/reminder';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
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
  /** Shows the checkbox disabled when there's no `onToggle` (e.g. someone else's task on a shared board), so titles stay aligned. */
  toggleDisabled?: boolean;
  /** Makes the row clickable: opens the task's details. */
  onOpen?: () => void;
  /** Shown at the start of the row, before the checkbox (e.g. Backlog's date column). */
  leading?: ReactNode;
  /** The row's secondary action (e.g. → Today), shown at the end of the row. */
  trailing?: ReactNode;
  /** Touch swipe actions: `left` = swipe left, `right` = swipe right. Skipped while drag-reordering. */
  swipe?: { left?: SwipeAction; right?: SwipeAction };
  showChips?: boolean;
  /** Leave out the Earlier / Today / Tomorrow label when the row shows its date another way (Backlog's date column). */
  hideDue?: boolean;
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
  toggleDisabled = false,
  onOpen,
  leading,
  trailing,
  swipe,
  showChips = true,
  hideDue = false,
  inline = false,
  rowRef,
  dragHandleProps,
}: TaskRowProps) {
  const { t, i18n } = useTranslation();
  const leaving = useIsLeaving(task.id);
  const areas = useLifeAreaLookup();
  // Highlight the row whose details are open in the side panel (mockup 03).
  const selected = useTaskFormState().task?.id === task.id;
  const urgency = hideDue ? null : dueUrgency(task);
  const area = task.areaId ? areas.get(task.areaId) : undefined;
  const reminder = !!task.dueDate && hasReminder(task);
  const hasChips =
    showChips &&
    (urgency ||
      task.priority ||
      task.energy ||
      task.estimatedMinutes != null ||
      area ||
      task.recurrence ||
      reminder ||
      task.createdVia);
  const swiped = swipe && !dragHandleProps;
  const onClick = openOnRowClick(onOpen);
  const rowClassName = [
    styles.row,
    inline && styles.inline,
    !hasChips && styles.noChips,
    onOpen && styles.clickable,
    selected && styles.selected,
    dragHandleProps?.dragging && styles.dragging,
    leaving && styles.leaving,
  ]
    .filter(Boolean)
    .join(' ');

  const row = (
    <div ref={rowRef} className={rowClassName} onClick={swiped ? undefined : onClick}>
      <div className={styles.lead}>
        {leading}
        {dragHandleProps && (
          <DragHandle
            label={t('task.reorder', { title: task.title })}
            dragging={dragHandleProps.dragging}
            className={styles.handle}
            onPointerDown={dragHandleProps.onPointerDown}
          />
        )}
        {(onToggle || toggleDisabled) && (
          <Checkbox
            checked={false}
            disabled={!onToggle}
            onChange={onToggle}
            label={t('task.markDone', { title: task.title })}
          />
        )}
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
        </span>
        {task.description && <span className={styles.description}>{htmlToText(task.description)}</span>}
      </div>
      {hasChips && (
        <div className={styles.chips}>
          {urgency && <Chip variant="plain">{t(dueLabelKey(urgency))}</Chip>}
          {task.priority && <MetaChip plain axis="priority" value={task.priority} />}
          {area && (
            <Chip variant="plain" dot={lifeAreaColorVar(area.order)}>
              {area.name}
            </Chip>
          )}
          {task.estimatedMinutes != null && <MetaChip plain axis="effort" minutes={task.estimatedMinutes} />}
          {task.energy && <MetaChip plain axis="energy" value={task.energy} />}
          {task.recurrence && <Chip variant="plain">↻ {recurrenceLabel(t, task)}</Chip>}
          {reminder && (
            <Chip variant="plain">
              <ReminderIcon title={`${t('taskForm.notify')}: ${reminderLabel(t, task, i18n.language)}`} />
            </Chip>
          )}
          {task.createdVia && <Chip variant="info">{t('agents.addedBy', { name: task.createdVia })}</Chip>}
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
