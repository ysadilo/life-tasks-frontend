import { useTranslation } from 'react-i18next';
import { TaskChip, taskForm } from '../../../components/task';
import { addDays, isSameDay, localISODate, startOfDay, startOfWeek, weekdayLabel } from '../../../lib/dateUtils';
import type { CalendarEntry } from '../../../lib/calendarEntries';
import { openCalendarEntry } from '../openCalendarEntry';
import styles from './WeekView.module.css';

interface WeekViewProps {
  anchor: Date;
  entries: CalendarEntry[];
}

export function WeekView({ anchor, entries }: WeekViewProps) {
  const { t, i18n } = useTranslation();
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  const todayStart = startOfDay(today);

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const dayEntries = entries.filter((entry) => isSameDay(entry.date, day));
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            key={day.toISOString()}
            className={[styles.column, isWeekend ? styles.weekend : ''].filter(Boolean).join(' ')}
          >
            <div className={[styles.dayHeader, isToday ? styles.today : ''].filter(Boolean).join(' ')}>
              <span className={styles.weekday}>{weekdayLabel(day, i18n.language)}</span>
              <span className={styles.dateNumber}>{day.getDate()}</span>
            </div>
            <div className={styles.chips}>
              {dayEntries.map((entry) => (
                <TaskChip
                  key={entry.key}
                  task={entry.task}
                  done={entry.done}
                  onClick={() => openCalendarEntry(entry)}
                />
              ))}
              {day >= todayStart && (
                <button
                  type="button"
                  className={styles.addPlaceholder}
                  onClick={() => taskForm.openNew(localISODate(day))}
                >
                  {t('calendar.addPlaceholder')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
