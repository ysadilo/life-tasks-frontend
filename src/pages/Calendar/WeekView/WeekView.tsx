import { useLayoutEffect, useRef, useState } from 'react';
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

/** Never collapse a day to only a "+N more" — always show at least this many chips. */
const MIN_VISIBLE_CHIPS = 1;

export function WeekView({ anchor, entries }: WeekViewProps) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  const todayStart = startOfDay(today);
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const openDayEntries = openDay ? entries.filter((entry) => isSameDay(entry.date, openDay)) : [];

  return (
    <div className={styles.grid}>
      {days.map((day) => (
        <DayColumn
          key={day.toISOString()}
          day={day}
          entries={entries.filter((entry) => isSameDay(entry.date, day))}
          isToday={isSameDay(day, today)}
          isWeekend={day.getDay() === 0 || day.getDay() === 6}
          canAdd={day >= todayStart}
          onMore={() => setOpenDay(day)}
        />
      ))}
      <DayTasksModal day={openDay} entries={openDayEntries} onClose={() => setOpenDay(null)} />
    </div>
  );
}

interface DayColumnProps {
  day: Date;
  entries: CalendarEntry[];
  isToday: boolean;
  isWeekend: boolean;
  canAdd: boolean;
  onMore: () => void;
}

function DayColumn({ day, entries, isToday, isWeekend, canAdd, onMore }: DayColumnProps) {
  const { t, i18n } = useTranslation();
  const chipsRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(entries.length);
  const [overflowing, setOverflowing] = useState(false);

  const entriesKey = entries.map((entry) => entry.key).join('|');

  useLayoutEffect(() => {
    const el = chipsRef.current;
    if (!el) return;

    const measure = () => {
      const chipEls = Array.from(el.querySelectorAll<HTMLElement>('[data-slot="chip"]'));
      const moreEl = el.querySelector<HTMLElement>('[data-slot="more"]');
      const addEl = el.querySelector<HTMLElement>('[data-slot="add"]');
      // Un-hide everything so offsetHeight reads are real.
      for (const node of [...chipEls, moreEl, addEl]) if (node) node.hidden = false;

      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      const avail = el.clientHeight;

      const countThatFit = (reserve: number) => {
        let used = 0;
        let n = 0;
        for (const chip of chipEls) {
          const next = used + (n ? gap : 0) + chip.offsetHeight;
          if (next + reserve <= avail) {
            used = next;
            n += 1;
          } else break;
        }
        return n;
      };

      const rawFit = countThatFit(0);
      const willOverflow = rawFit < chipEls.length;
      const fit = willOverflow
        ? Math.max(countThatFit(moreEl ? moreEl.offsetHeight + gap : 0), MIN_VISIBLE_CHIPS)
        : rawFit;

      // Apply imperatively too: setLimit may be a no-op (same value) and then
      // React won't re-render to fix the `hidden` props.
      chipEls.forEach((chip, i) => (chip.hidden = i >= fit));
      if (moreEl) moreEl.hidden = !willOverflow;
      if (addEl) addEl.hidden = willOverflow;

      setLimit(fit);
      setOverflowing(willOverflow);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [entriesKey]);

  const overflow = entries.length - limit;

  return (
    <div
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
      <div className={styles.chips} ref={chipsRef}>
        {entries.map((entry, i) => (
          <div key={entry.key} data-slot="chip" hidden={i >= limit}>
            <TaskChip task={entry.task} done={entry.done} onClick={() => openCalendarEntry(entry)} />
          </div>
        ))}
        <button
          type="button"
          className={styles.more}
          onClick={onMore}
          data-slot="more"
          hidden={!overflowing || overflow <= 0}
        >
          {t('calendar.more', { count: Math.max(overflow, 1) })}
        </button>
        {canAdd && (
          <button
            type="button"
            className={styles.addPlaceholder}
            onClick={() => taskForm.openNew(localISODate(day))}
            data-slot="add"
            hidden={overflowing}
          >
            {t('calendar.addPlaceholder')}
          </button>
        )}
      </div>
    </div>
  );
}
