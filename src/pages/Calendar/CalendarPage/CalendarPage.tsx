import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../../components/layout';
import { Button, SegmentedTabs } from '../../../components/ui';
import { useTasksInRange } from '../../../hooks/useTasks';
import {
  addDays,
  buildMonthGrid,
  formatMonthTitle,
  formatWeekRangeTitle,
  startOfWeek,
  toISODate,
} from '../../../lib/dateUtils';
import { isOverdue } from '../../../lib/taskDates';
import { buildCalendarEntries } from '../../../lib/calendarEntries';
import { WeekView } from '../WeekView';
import { MonthView } from '../MonthView';
import styles from './CalendarPage.module.css';

type ViewMode = 'week' | 'month';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { view } = useParams<{ view: string }>();
  const mode: ViewMode = view === 'month' ? 'month' : 'week';
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());

  const viewOptions = useMemo(
    () => [
      { value: 'week', label: t('nav.week') },
      { value: 'month', label: t('nav.month') },
    ],
    [t]
  );

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
  const overdueCount = useMemo(() => (tasks ?? []).filter((task) => isOverdue(task)).length, [tasks]);

  function goPrev() {
    setAnchor((current) =>
      mode === 'week' ? addDays(current, -7) : new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  }

  function goNext() {
    setAnchor((current) =>
      mode === 'week' ? addDays(current, 7) : new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }

  if (isLoading) return <PageState>{t('calendar.loading')}</PageState>;
  if (error) return <PageState>{t('calendar.error')}</PageState>;

  const subtitle =
    t('calendar.tasksScheduled', { count: entries.length }) +
    (overdueCount ? t('calendar.overdueSuffix', { count: overdueCount }) : '');

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <div className={styles.navControls}>
              <Button variant="ghost" onClick={goPrev} aria-label={t('calendar.previousPeriod')}>
                ‹
              </Button>
              <Button variant="ghost" onClick={() => setAnchor(new Date())}>
                {t('calendar.today')}
              </Button>
              <Button variant="ghost" onClick={goNext} aria-label={t('calendar.nextPeriod')}>
                ›
              </Button>
            </div>
            <SegmentedTabs options={viewOptions} value={mode} onChange={(value) => navigate(`/calendar/${value}`)} />
          </>
        }
      />

      {mode === 'week' ? (
        <WeekView anchor={anchor} entries={entries} />
      ) : (
        <MonthView anchor={anchor} entries={entries} />
      )}
    </div>
  );
}
