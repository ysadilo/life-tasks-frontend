import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { RichText } from '../../ui/RichText';
import { MetaChip } from '../MetaChip';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { isBlankHtml } from '../../../lib/richText';
import { recurrenceLabel } from '../../../lib/recurrence';
import { formatMinutes } from '../../../lib/taskMeta';
import type { Task } from '../../../models';
import styles from './TaskDetails.module.css';

interface TaskDetailsProps {
  task: Task;
  onEdit: () => void;
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
export function TaskDetails({ task, onEdit }: TaskDetailsProps) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const areaName = task.areaId ? areas.get(task.areaId)?.name : undefined;

  return (
    <div className={styles.view}>
      <div className={styles.content}>
        <h3 className={styles.title}>{task.title}</h3>
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
        {task.description && !isBlankHtml(task.description) && <RichText html={task.description} />}
      </div>
      <div className={styles.footer}>
        <Button type="button" variant="primary" onClick={onEdit}>
          {t('taskView.edit')}
        </Button>
      </div>
    </div>
  );
}
