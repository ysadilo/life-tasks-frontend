import { useTranslation } from 'react-i18next';
import { TaskChip } from '../../../components/task';
import { buildMonthGrid, isSameDay, weekdayLabel } from '../../../lib/dateUtils';
import type { CalendarEntry } from '../../../lib/calendarEntries';
import { openCalendarEntry } from '../openCalendarEntry';
import styles from './MonthView.module.css';

interface MonthViewProps {
  anchor: Date;
  entries: CalendarEntry[];
}

const VISIBLE_CHIPS_PER_CELL = 3;

export function MonthView({ anchor, entries }: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const cells = buildMonthGrid(anchor);
  const weekdayLabels = cells.slice(0, 7).map((cell) => weekdayLabel(cell.date, i18n.language));
  const today = new Date();

  return (
    <div className={styles.wrap}>
      <div className={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <span key={index} className={styles.weekdayLabel}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((cell) => {
          const dayEntries = entries.filter((entry) => isSameDay(entry.date, cell.date));
          const visible = dayEntries.slice(0, VISIBLE_CHIPS_PER_CELL);
          const overflow = dayEntries.length - visible.length;
          const isToday = isSameDay(cell.date, today);

          return (
            <div
              key={cell.date.toISOString()}
              className={[styles.cell, !cell.isCurrentMonth ? styles.faded : '', isToday ? styles.today : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.dateNumber}>
                {cell.date.getDate()}
                {isToday ? t('calendar.todaySuffix') : ''}
              </span>
              <div className={styles.chips}>
                {visible.map((entry) => (
                  <TaskChip
                    key={entry.key}
                    task={entry.task}
                    done={entry.done}
                    onClick={() => openCalendarEntry(entry)}
                  />
                ))}
                {overflow > 0 && <span className={styles.more}>{t('calendar.more', { count: overflow })}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
