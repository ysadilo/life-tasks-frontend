import { useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../../components/layout';
import { useTasksInRange } from '../../../hooks/useTasks';
import {
  addDays,
  buildMonthGrid,
  formatMonthTitle,
  formatWeekRangeTitle,
  startOfDay,
  startOfWeek,
  toISODate,
} from '../../../lib/dateUtils';
import { buildCalendarEntries } from '../../../lib/calendarEntries';
import { WeekView } from '../WeekView';
import { MonthView } from '../MonthView';
import styles from './CalendarPage.module.css';

type ViewMode = 'week' | 'month';

const VIEWS: ViewMode[] = ['week', 'month'];

const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { view } = useParams<{ view: string }>();
  const mode: ViewMode = view === 'month' ? 'month' : 'week';
  const [anchor, setAnchor] = useState(() => new Date());
  // Month view lists this day's tasks; it opens on today.
  const [selected, setSelected] = useState(() => startOfDay(new Date()));

  const { from, to, fromDate, toDate, title } = useMemo(() => {
    if (mode === 'week') {
      const start = startOfWeek(anchor);
      const last = addDays(start, 6);
      return {
        from: toISODate(start),
        to: toISODate(last),
        fromDate: start,
        toDate: last,
        title: formatWeekRangeTitle(start, i18n.language),
      };
    }
    const cells = buildMonthGrid(anchor);
    return {
      from: toISODate(cells[0].date),
      to: toISODate(cells[cells.length - 1].date),
      fromDate: cells[0].date,
      toDate: cells[cells.length - 1].date,
      title: formatMonthTitle(anchor, i18n.language),
    };
  }, [anchor, mode, i18n.language]);

  const { data: tasks, isLoading, error } = useTasksInRange(from, to);

  const entries = useMemo(() => buildCalendarEntries(tasks ?? [], fromDate, toDate), [tasks, fromDate, toDate]);
  const monthCount = entries.filter((entry) => !entry.task.recurrence && sameMonth(entry.date, anchor)).length;

  /** Month view: land on today when the month has it, else on its 1st. */
  function showMonth(month: Date) {
    const today = startOfDay(new Date());
    setAnchor(month);
    setSelected(sameMonth(month, today) ? today : new Date(month.getFullYear(), month.getMonth(), 1));
  }

  function step(direction: 1 | -1) {
    if (mode === 'week') setAnchor((current) => addDays(current, 7 * direction));
    else showMonth(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
  }

  function goToday() {
    setAnchor(new Date());
    setSelected(startOfDay(new Date()));
  }

  function selectDay(day: Date) {
    setSelected(day);
    if (!sameMonth(day, anchor)) setAnchor(day);
  }

  if (isLoading) return <PageState>{t('calendar.loading')}</PageState>;
  if (error) return <PageState>{t('calendar.error')}</PageState>;

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        subtitle={mode === 'month' ? t('calendar.monthCount', { count: monthCount }) : undefined}
        actions={
          <div className={styles.controls}>
            <nav className={styles.views} aria-label={t('nav.calendar')}>
              {VIEWS.map((value) => (
                <NavLink
                  key={value}
                  to={`/calendar/${value}`}
                  className={({ isActive }) => (isActive ? `${styles.view} ${styles.viewActive}` : styles.view)}
                >
                  {t(`nav.${value}`)}
                </NavLink>
              ))}
            </nav>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => step(-1)}
                aria-label={t('calendar.previousPeriod')}
              >
                ‹
              </button>
              <button type="button" className={styles.stepButton} onClick={goToday}>
                {t('calendar.today')}
              </button>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => step(1)}
                aria-label={t('calendar.nextPeriod')}
              >
                ›
              </button>
            </div>
          </div>
        }
      />

      {mode === 'week' ? (
        <WeekView anchor={anchor} entries={entries} />
      ) : (
        <MonthView anchor={anchor} entries={entries} selected={selected} onSelect={selectDay} />
      )}
    </div>
  );
}
