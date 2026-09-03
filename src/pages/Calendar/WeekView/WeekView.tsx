import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskChip, taskForm } from '../../../components/task';
import { addDays, isSameDay, localISODate, startOfDay, startOfWeek, weekdayLabel } from '../../../lib/dateUtils';
import type { CalendarEntry } from '../../../lib/calendarEntries';
import { openCalendarEntry } from '../openCalendarEntry';
import { DayTasksModal } from '../DayTasksModal';
import styles from './WeekView.module.css';

interface WeekViewProps {
  anchor: Date;
  entries: CalendarEntry[];
}

const VISIBLE_CHIPS_PER_DAY = 4;

export function WeekView({ anchor, entries }: WeekViewProps) {
  const { t, i18n } = useTranslation();
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  const todayStart = startOfDay(today);
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const openDayEntries = openDay ? entries.filter((entry) => isSameDay(entry.date, openDay)) : [];

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const dayEntries = entries.filter((entry) => isSameDay(entry.date, day));
        const visible = dayEntries.slice(0, VISIBLE_CHIPS_PER_DAY);
        const overflow = dayEntries.length - visible.length;
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            key={day.toISOString()}
            className={[styles.column, isWeekend ? styles.weekend : '', isToday ? styles.today : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className={styles.dayHeader}>
              <span className={styles.weekday}>
                {weekdayLabel(day, i18n.language)}
                {isToday ? t('calendar.todaySuffix') : ''}
              </span>
              <span className={styles.dateNumber}>{day.getDate()}</span>
            </div>
            <div className={styles.chips}>
              {visible.map((entry) => (
                <TaskChip
                  key={entry.key}
                  task={entry.task}
                  done={entry.done}
                  onClick={() => openCalendarEntry(entry)}
                />
              ))}
              {overflow > 0 && (
                <button type="button" className={styles.more} onClick={() => setOpenDay(day)}>
                  {t('calendar.more', { count: overflow })}
                </button>
              )}
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
      <DayTasksModal day={openDay} entries={openDayEntries} onClose={() => setOpenDay(null)} />
    </div>
  );
}
