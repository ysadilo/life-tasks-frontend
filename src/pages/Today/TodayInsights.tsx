import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionLabel } from '../../components/ui';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { useRecurringTasks, useTasksByStatus } from '../../hooks/useTasks';
import { addDays, startOfWeek } from '../../lib/dateUtils';
import { completionsOf } from '../../lib/insights';
import { lifeAreaColorVar } from '../../lib/lifeAreas';
import { formatMinutes } from '../../lib/taskMeta';
import { doneByWeekday, tasksForTomorrow, usualMinutesOn } from '../../lib/todayInsights';
import type { Task } from '../../models';
import styles from './TodayInsights.module.css';

/** Under this many minutes apart, today counts as a usual day. */
const SAME_DAY_MINUTES = 15;

interface TodayInsightsProps {
  /** Everything on today's plan, open and done, for the planned minutes. */
  dayTasks: Task[];
  today: Date;
}

/** Solo Today rail under the filters: today's load against the usual weekday, this week's done bars, tomorrow's tasks. */
export function TodayInsights({ dayTasks, today }: TodayInsightsProps) {
  const { t, i18n } = useTranslation();
  const { data: done } = useTasksByStatus('done');
  const { data: backlog } = useTasksByStatus('backlog');
  const { data: recurring } = useRecurringTasks();
  const { data: areas } = useLifeAreas();

  const completions = useMemo(() => completionsOf([...(done ?? []), ...(recurring ?? [])]), [done, recurring]);
  const usual = useMemo(() => usualMinutesOn(completions, today), [completions, today]);
  const week = useMemo(() => doneByWeekday(completions, today), [completions, today]);
  const tomorrow = useMemo(() => tasksForTomorrow(backlog ?? [], recurring ?? [], today), [backlog, recurring, today]);

  const planned = dayTasks.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);
  // The larger of the two sits at 80%, so the bar never looks full.
  const scale = Math.max(planned, usual ?? 0) / 0.8 || 1;
  const diff = usual === null ? 0 : planned - usual;
  const weekday = today.toLocaleDateString(i18n.language, { weekday: 'long' });
  const todayIndex = (today.getDay() + 6) % 7;
  const maxDone = Math.max(1, ...week);
  const monday = startOfWeek(today);
  const areaOf = (task: Task) => areas?.find((a) => a.id === task.areaId);

  return (
    <>
      <section className={styles.card}>
        <SectionLabel>{t('today.load')}</SectionLabel>
        <div className={styles.loadLine}>
          <span className={styles.loadValue}>{formatMinutes(planned)}</span>
          <span className={styles.muted}>{t('today.planned')}</span>
        </div>
        <div className={styles.loadBar}>
          <div className={styles.loadFill} style={{ width: `${(planned / scale) * 100}%` }} />
          {usual !== null && <span className={styles.loadMarker} style={{ left: `${(usual / scale) * 100}%` }} />}
        </div>
        {usual !== null && (
          <span className={styles.note}>
            {t('today.loadUsual', { weekday, usual: formatMinutes(usual) })}{' '}
            {Math.abs(diff) < SAME_DAY_MINUTES
              ? t('today.loadSame')
              : t(diff > 0 ? 'today.loadHeavier' : 'today.loadLighter', { diff: formatMinutes(Math.abs(diff)) })}
          </span>
        )}
      </section>

      <section className={styles.card}>
        <SectionLabel>{t('today.thisWeek')}</SectionLabel>
        <div className={styles.weekBars}>
          {week.map((count, i) => (
            <div key={i} className={styles.weekDay} aria-current={i === todayIndex ? 'date' : undefined}>
              <div
                className={styles.weekBar}
                data-empty={count === 0 || undefined}
                style={{ height: count ? `${(count / maxDone) * 64}px` : undefined }}
                title={String(count)}
              />
              <span className={styles.weekLabel}>
                {addDays(monday, i).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
              </span>
            </div>
          ))}
        </div>
        <span className={styles.muted}>{t('today.doneSoFar', { count: week.reduce((a, b) => a + b, 0) })}</span>
      </section>

      <section className={styles.tomorrow}>
        <SectionLabel>{t('today.tomorrow')}</SectionLabel>
        {tomorrow.length === 0 && <span className={styles.note}>{t('today.tomorrowEmpty')}</span>}
        {tomorrow.map((task) => {
          const area = areaOf(task);
          return (
            <div key={task.id} className={styles.tomorrowRow}>
              <span
                className={styles.dot}
                style={{ background: area ? lifeAreaColorVar(area.order) : undefined }}
                aria-hidden
              />
              <span className={styles.tomorrowTitle}>{task.title}</span>
              {task.notifyTime && <span className={styles.muted}>{task.notifyTime}</span>}
            </div>
          );
        })}
      </section>
    </>
  );
}
