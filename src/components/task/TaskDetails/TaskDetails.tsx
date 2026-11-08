import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';
import { SamoyedNudge } from '../../ui/Samoyed';
import { Chip } from '../../ui/Chip';
import { RichText } from '../../ui/RichText';
import { MetaChip } from '../MetaChip';
import { ReminderIcon } from '../ReminderIcon';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { isBlankHtml } from '../../../lib/richText';
import { useUpdateTask, useUpdateTaskStatus } from '../../../hooks/useTasks';
import { useDeleteTaskWithUndo } from '../../../hooks/useDeleteTaskWithUndo';
import { leaveThen } from '../taskLeavingStore';
import { tryAppear } from '../../../lib/samoyed';
import { daysOverdue, dueUrgency, isOverdue } from '../../../lib/taskDates';
import { recurrenceLabel } from '../../../lib/recurrence';
import { hasReminder, reminderLabel } from '../../../lib/reminder';
import { formatMinutes } from '../../../lib/taskMeta';
import type { Task } from '../../../models';
import styles from './TaskDetails.module.css';

const NUDGE_AFTER_DAYS = 3;

interface TaskDetailsProps {
  task: Task;
  onEdit: (task: Task) => void;
  onClose: () => void;
}

/** Stored dates are UTC-midnight; format the calendar day they name, whatever the viewer's timezone. */
function formatDay(iso: string): string {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.value}>{children}</div>
    </div>
  );
}

/** Read-only task details shown in the side panel when a row is clicked; Edit switches to the form. */
export function TaskDetails({ task, onEdit, onClose }: TaskDetailsProps) {
  const { t, i18n } = useTranslation();
  const areas = useLifeAreaLookup();
  const areaName = task.areaId ? areas.get(task.areaId)?.name : undefined;

  const updateTask = useUpdateTask();
  // Local copy so a ticked checklist item shows at once; reverted if the save fails.
  const [description, setDescription] = useState(task.description);
  const toggleItem = (html: string) => {
    const previous = description;
    setDescription(html);
    updateTask.mutate(
      { id: task.id, title: task.title, description: html },
      { onError: () => setDescription(previous) }
    );
  };
  // The store still holds the task as it was opened — hand the form the current description.
  const edit = () => onEdit({ ...task, description });

  const deleteTask = useDeleteTaskWithUndo();
  const updateStatus = useUpdateTaskStatus();
  const remove = () => {
    onClose();
    void deleteTask({ ...task, description });
  };
  // Same rules as the form and Today's swipe: recurring tasks aren't moved per day, and the BE would
  // promote a due-today/overdue task straight back to Today.
  const canMoveToBacklog = task.status === 'today' && !task.recurrence;
  const urgency = dueUrgency(task);
  const mustStayToday = urgency === 'overdue' || urgency === 'today';
  // Close first so the row's exit animation is visible, then move it.
  const moveToBacklog = () => {
    onClose();
    void leaveThen(task.id, () => updateStatus.mutateAsync({ id: task.id, status: 'backlog' }));
  };

  const nudge = isOverdue(task) && daysOverdue(task) >= NUDGE_AFTER_DAYS && tryAppear('overdue');

  return (
    <div className={styles.view}>
      <div className={styles.content}>
        <h3 className={styles.title}>{task.title}</h3>
        {nudge && (
          <SamoyedNudge
            moment="overdue"
            actions={
              <Button type="button" variant="primary" onClick={edit}>
                {t('samoyed.overdueAction')}
              </Button>
            }
          />
        )}
        <div className={styles.props}>
          {task.dueDate && (
            <Property label={task.recurrence ? t('taskForm.startsOn') : t('taskForm.dueDate')}>
              <Chip>{formatDay(task.dueDate)}</Chip>
            </Property>
          )}
          {task.priority && (
            <Property label={t('taskForm.priority')}>
              <MetaChip axis="priority" value={task.priority} />
            </Property>
          )}
          {task.estimatedMinutes != null && (
            <Property label={t('taskForm.effort')}>
              <MetaChip axis="effort" minutes={task.estimatedMinutes} />
            </Property>
          )}
          {task.energy && (
            <Property label={t('taskForm.energy')}>
              <MetaChip axis="energy" value={task.energy} />
            </Property>
          )}
          {areaName && (
            <Property label={t('taskForm.area')}>
              <Chip>{areaName}</Chip>
            </Property>
          )}
          {task.recurrence && (
            <Property label={t('taskForm.recurrence')}>
              <Chip>{recurrenceLabel(t, task)}</Chip>
              {task.recurrenceEndDate && (
                <span className={styles.note}>
                  {t('taskForm.recurrenceEnd')} {formatDay(task.recurrenceEndDate)}
                </span>
              )}
            </Property>
          )}
          {task.dueDate && hasReminder(task) && (
            <Property label={t('taskForm.notify')}>
              <Chip>
                <ReminderIcon /> {reminderLabel(t, task, i18n.language)}
              </Chip>
            </Property>
          )}
          {task.feeling && (
            <Property label={t('taskView.feeling')}>
              <Chip>{t(`reflect.feeling.${task.feeling}`)}</Chip>
            </Property>
          )}
          {task.actualMinutes != null && (
            <Property label={t('taskView.took')}>
              <Chip>{formatMinutes(task.actualMinutes)}</Chip>
            </Property>
          )}
        </div>
        {description && !isBlankHtml(description) && <RichText html={description} onChange={toggleItem} />}
      </div>
      <div className={styles.footer}>
        <Button type="button" variant="primary" onClick={edit}>
          {t('taskView.edit')}
        </Button>
        <div className={styles.footerRight}>
          <button type="button" className={styles.delete} onClick={remove}>
            {t('taskForm.delete')}
          </button>
          {canMoveToBacklog && (
            <Tooltip text={mustStayToday && t('taskForm.backlogDueHint')}>
              <Button
                type="button"
                variant="secondary"
                aria-disabled={mustStayToday}
                onClick={mustStayToday ? undefined : moveToBacklog}
              >
                {t('taskForm.moveToBacklog')}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
