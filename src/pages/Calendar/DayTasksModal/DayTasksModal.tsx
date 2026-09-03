import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { TaskRow, taskForm } from '../../../components/task';
import { localISODate } from '../../../lib/dateUtils';
import type { CalendarEntry } from '../../../lib/calendarEntries';
import { openCalendarEntry } from '../openCalendarEntry';
import styles from './DayTasksModal.module.css';

interface DayTasksModalProps {
  day: Date | null;
  entries: CalendarEntry[];
  onClose: () => void;
}

/** Full task list for one calendar day — opened from a month cell / its "+N more". */
export function DayTasksModal({ day, entries, onClose }: DayTasksModalProps) {
  const { t, i18n } = useTranslation();

  // Done items last, otherwise keep the incoming (date-build) order.
  const ordered = useMemo(() => [...entries].sort((a, b) => Number(a.done) - Number(b.done)), [entries]);
  const doneCount = ordered.filter((entry) => entry.done).length;

  const title = day ? day.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return (
    <Modal open={day != null} onClose={onClose} closeLabel={t('taskForm.close')} title={title}>
      <div className={styles.body}>
        <p className={styles.summary}>{t('calendar.daySummary', { count: ordered.length, done: doneCount })}</p>

        <div className={styles.list}>
          {ordered.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={styles.row}
              onClick={() => {
                openCalendarEntry(entry);
                onClose();
              }}
            >
              <TaskRow task={entry.task} />
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (day) taskForm.openNew(localISODate(day));
              onClose();
            }}
          >
            {t('calendar.addTask')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
