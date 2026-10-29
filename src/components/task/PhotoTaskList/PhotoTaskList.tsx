import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { MetaChip } from '../MetaChip';
import { dayMonthLabel } from '../../../lib/dateUtils';
import type { TaskDraft } from '../../../lib/quickAdd';
import type { TaskStatus } from '../../../models';
import form from '../TaskFormPanel/TaskFormPanel.module.css';
import styles from './PhotoTaskList.module.css';

interface PhotoTaskListProps {
  drafts: TaskDraft[];
  included: boolean[];
  /** Object URL of the picture the tasks were read from. */
  photoUrl: string | null;
  count: number;
  canBacklog: boolean;
  pending: boolean;
  failed: boolean;
  onToggle: (index: number) => void;
  onOpen: (index: number) => void;
  onCancel: () => void;
  onAdd: (status: TaskStatus) => void;
}

/** Several tasks found in one photo: untick the ones to skip, tap one to edit it, then add them all. */
export function PhotoTaskList({
  drafts,
  included,
  photoUrl,
  count,
  canBacklog,
  pending,
  failed,
  onToggle,
  onOpen,
  onCancel,
  onAdd,
}: PhotoTaskListProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className={form.form}>
      <div className={form.fields}>
        <div className={styles.intro}>
          {photoUrl && <img className={styles.photo} src={photoUrl} alt="" />}
          <p className={styles.hint}>{t('photoBatch.hint', { count: drafts.length })}</p>
        </div>
        <ul className={styles.list}>
          {drafts.map((draft, index) => (
            <li key={index} className={[styles.row, included[index] ? '' : styles.skipped].join(' ')}>
              <Checkbox
                checked={included[index]}
                onChange={() => onToggle(index)}
                label={t('photoBatch.include', { title: draft.title })}
              />
              <button type="button" className={styles.open} onClick={() => onOpen(index)}>
                <span className={styles.title}>{draft.title}</span>
                {(draft.dueDate || draft.priority || draft.minutes) && (
                  <span className={styles.chips}>
                    {draft.dueDate && (
                      <span className={styles.date}>{dayMonthLabel(draft.dueDate, i18n.language)}</span>
                    )}
                    {draft.priority && <MetaChip axis="priority" value={draft.priority} />}
                    {draft.minutes != null && <MetaChip axis="effort" minutes={draft.minutes} />}
                  </span>
                )}
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
        {failed && <p className={form.error}>{t('taskForm.error')}</p>}
      </div>

      <div className={form.footer}>
        <Button type="button" variant="ghost" className={styles.cancel} disabled={pending} onClick={onCancel}>
          {t('taskForm.cancel')}
        </Button>
        <div className={[form.footerRight, styles.actions].join(' ')}>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !count || !canBacklog}
            onClick={() => onAdd('backlog')}
          >
            {t('photoBatch.addToBacklog', { count })}
          </Button>
          <Button type="button" variant="primary" disabled={pending || !count} onClick={() => onAdd('today')}>
            {t('photoBatch.addToToday', { count })}
          </Button>
        </div>
      </div>
    </div>
  );
}
