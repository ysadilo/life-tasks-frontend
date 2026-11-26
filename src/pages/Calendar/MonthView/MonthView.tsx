import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { taskForm } from '../../../components/task';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { buildMonthGrid, isSameDay, localISODate, startOfDay } from '../../../lib/dateUtils';
import { entryTime, splitDayEntries, type CalendarEntry } from '../../../lib/calendarEntries';
import { isOverdue } from '../../../lib/taskDates';
import { openCalendarEntry } from '../openCalendarEntry';
import { RoutinesToggle } from '../RoutinesToggle';
import styles from './MonthView.module.css';

interface MonthViewProps {
  anchor: Date;
  entries: CalendarEntry[];
  /** The day whose tasks the panel lists (today when the page opens). */
  selected: Date;
  onSelect: (day: Date) => void;
}

/** Area dots under a day number; one per one-off task, at most this many. */
const MAX_DOTS = 3;

/** v7 month: a compact grid with area dots, and the selected day's tasks beside it (below on phones). */
export function MonthView({ anchor, entries, selected, onSelect }: MonthViewProps) {
  const { i18n } = useTranslation();
  const areas = useLifeAreaLookup();
  const cells = buildMonthGrid(anchor);
  const today = new Date();
  const weekdayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' });
  const dayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  const entriesOn = (day: Date) => entries.filter((entry) => isSameDay(entry.date, day));

  return (
    <div className={styles.layout}>
      <div className={styles.calendar}>
        <div className={styles.weekdays} aria-hidden="true">
          {cells.slice(0, 7).map((cell) => (
            <span key={cell.date.getDay()}>{weekdayFormat.format(cell.date)}</span>
          ))}
        </div>
        <div className={styles.grid}>
          {cells.map((cell) => {
            const { tasks } = splitDayEntries(entriesOn(cell.date));
            const isSelected = isSameDay(cell.date, selected);
            const isToday = isSameDay(cell.date, today);
            return (
              <button
                key={cell.date.toISOString()}
                type="button"
                aria-pressed={isSelected}
                aria-label={dayFormat.format(cell.date)}
                aria-current={isToday ? 'date' : undefined}
                className={[styles.cell, cell.isCurrentMonth ? '' : styles.otherMonth, isToday ? styles.today : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(cell.date)}
              >
                <span className={styles.number}>{cell.date.getDate()}</span>
                <span className={styles.dots} aria-hidden="true">
                  {tasks.slice(0, MAX_DOTS).map((entry) => {
                    const area = entry.task.areaId ? areas.get(entry.task.areaId) : undefined;
                    return (
                      <span
                        key={entry.key}
                        className={styles.dot}
                        style={{ background: area ? lifeAreaColorVar(area.order) : undefined }}
                      />
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <DayPanel
        key={selected.toISOString()}
        day={selected}
        title={dayFormat.format(selected)}
        entries={entriesOn(selected)}
      />
    </div>
  );
}

interface DayPanelProps {
  day: Date;
  title: string;
  entries: CalendarEntry[];
}

function DayPanel({ day, title, entries }: DayPanelProps) {
  const { t, i18n } = useTranslation();
  const areas = useLifeAreaLookup();
  // The panel is where you look up a day, so its routines start unfolded.
  const [showRoutines, setShowRoutines] = useState(true);
  const { tasks, routines } = splitDayEntries(entries);
  const canAdd = day >= startOfDay(new Date());

  const row = (entry: CalendarEntry) => {
    const area = entry.task.areaId ? areas.get(entry.task.areaId) : undefined;
    const label =
      !entry.done && !entry.task.recurrence && isOverdue(entry.task)
        ? t('calendar.overdue')
        : (entryTime(entry, i18n.language) ?? t('calendar.anyTime'));
    return (
      <button key={entry.key} type="button" className={styles.row} onClick={() => openCalendarEntry(entry)}>
        <span className={styles.rowLabel}>{label}</span>
        <span
          className={styles.rowDot}
          style={{ background: area ? lifeAreaColorVar(area.order) : 'transparent' }}
          aria-hidden="true"
        />
        <span className={entry.done ? `${styles.rowTitle} ${styles.rowDone}` : styles.rowTitle}>
          {entry.task.title}
        </span>
      </button>
    );
  };

  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{title}</h2>
        {routines.length > 0 && (
          <RoutinesToggle
            count={routines.length}
            open={showRoutines}
            onToggle={() => setShowRoutines((open) => !open)}
          />
        )}
      </div>
      {showRoutines && routines.map(row)}
      {tasks.map(row)}
      {entries.length === 0 && <p className={styles.empty}>{t('calendar.emptyDay')}</p>}
      {canAdd && (
        <button type="button" className={styles.addTask} onClick={() => taskForm.openNew(localISODate(day))}>
          + {t('calendar.addTask')}
        </button>
      )}
    </section>
  );
}
