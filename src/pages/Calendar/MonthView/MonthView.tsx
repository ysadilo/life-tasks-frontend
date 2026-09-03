import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskChip } from '../../../components/task';
import { buildMonthGrid, isSameDay, weekdayLabel } from '../../../lib/dateUtils';
import type { CalendarEntry } from '../../../lib/calendarEntries';
import { DayTasksModal } from '../DayTasksModal';
import styles from './MonthView.module.css';

interface MonthViewProps {
  anchor: Date;
  entries: CalendarEntry[];
}

const VISIBLE_CHIPS_PER_CELL = 2;

export function MonthView({ anchor, entries }: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const cells = buildMonthGrid(anchor);
  const weekdayLabels = cells.slice(0, 7).map((cell) => weekdayLabel(cell.date, i18n.language));
  const today = new Date();
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const openDayEntries = openDay ? entries.filter((entry) => isSameDay(entry.date, openDay)) : [];

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
            <button
              key={cell.date.toISOString()}
              type="button"
              className={[styles.cell, !cell.isCurrentMonth ? styles.faded : '', isToday ? styles.today : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setOpenDay(cell.date)}
            >
              <span className={styles.dateNumber}>
                {cell.date.getDate()}
                {isToday ? t('calendar.todaySuffix') : ''}
              </span>
              <div className={styles.chips}>
                {visible.map((entry) => (
                  <TaskChip key={entry.key} task={entry.task} done={entry.done} />
                ))}
                {overflow > 0 && <span className={styles.more}>{t('calendar.more', { count: overflow })}</span>}
              </div>
            </button>
          );
        })}
      </div>
      <DayTasksModal day={openDay} entries={openDayEntries} onClose={() => setOpenDay(null)} />
    </div>
  );
}
