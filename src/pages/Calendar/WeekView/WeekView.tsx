import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskChip, taskForm } from '../../../components/task';
import { useScrollTodayIntoView } from '../../../hooks/useScrollTodayIntoView';
import { addDays, isSameDay, localISODate, startOfDay, startOfWeek, weekdayLabel } from '../../../lib/dateUtils';
import { entryTime, splitDayEntries, type CalendarEntry } from '../../../lib/calendarEntries';
import { openCalendarEntry } from '../openCalendarEntry';
import { RoutinesToggle } from '../RoutinesToggle';
import styles from './WeekView.module.css';

interface WeekViewProps {
  anchor: Date;
  entries: CalendarEntry[];
}

export function WeekView({ anchor, entries }: WeekViewProps) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  const todayStart = startOfDay(today);
  const gridRef = useRef<HTMLDivElement>(null);
  useScrollTodayIntoView(gridRef, start.toISOString());

  return (
    <div className={styles.grid} ref={gridRef}>
      {days.map((day) => (
        <DayColumn
          key={day.toISOString()}
          day={day}
          entries={entries.filter((entry) => isSameDay(entry.date, day))}
          isToday={isSameDay(day, today)}
          isPast={day < todayStart}
        />
      ))}
    </div>
  );
}

interface DayColumnProps {
  day: Date;
  entries: CalendarEntry[];
  isToday: boolean;
  isPast: boolean;
}

function DayColumn({ day, entries, isToday, isPast }: DayColumnProps) {
  const { t, i18n } = useTranslation();
  const [showRoutines, setShowRoutines] = useState(false);
  const { tasks, routines } = splitDayEntries(entries);

  const chip = (entry: CalendarEntry) => (
    <TaskChip
      key={entry.key}
      task={entry.task}
      done={entry.done}
      time={entryTime(entry, i18n.language)}
      onClick={() => openCalendarEntry(entry)}
    />
  );

  return (
    <div data-today={isToday || undefined} className={isToday ? `${styles.column} ${styles.today}` : styles.column}>
      <div className={styles.dayHeader}>
        <span className={styles.weekday}>{weekdayLabel(day, i18n.language)}</span>
        <span className={[styles.dateNumber, isPast ? styles.pastNumber : ''].filter(Boolean).join(' ')}>
          {day.getDate()}
        </span>
      </div>
      {routines.length > 0 && (
        <RoutinesToggle
          className={styles.routines}
          count={routines.length}
          open={showRoutines}
          onToggle={() => setShowRoutines((open) => !open)}
        />
      )}
      {showRoutines && routines.map(chip)}
      {tasks.map(chip)}
      {!isPast && (
        <button type="button" className={styles.add} onClick={() => taskForm.openNew(localISODate(day))}>
          {t('calendar.addPlaceholder')}
        </button>
      )}
    </div>
  );
}
