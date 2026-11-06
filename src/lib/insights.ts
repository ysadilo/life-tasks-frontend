import type { Energy, Feeling, LifeAreaId, Task } from '../models';
import { addDays, buildMonthGrid, localISODate, startOfDay, startOfWeek } from './dateUtils';
import { ENERGIES } from './taskMeta';
import { occurrencesBetween, isOccurrenceDone } from './recurrence';

export type InsightRange = 'week' | 'month' | 'year';
export const INSIGHT_RANGES: InsightRange[] = ['week', 'month', 'year'];

/** Feeling score used for averages: Drained 1 … Great 5. */
export const FEELING_SCORE: Record<Feeling, number> = { drained: 1, heavy: 2, neutral: 3, good: 4, great: 5 };

/** Effort points of a task estimate: 15m = 1, 1h = 2, anything longer = 4. Unestimated = 0. */
export function effortPoints(minutes?: number | null): number {
  if (!minutes) return 0;
  return minutes <= 15 ? 1 : minutes <= 60 ? 2 : 4;
}

export const STREAK_MILESTONES = [7, 30, 100];
const BURNOUT_MIN_CHECKINS = 3;
const MEDIAN_WEEKS = 8;
const HABIT_LOOKBACK_DAYS = 365;

/** One finished task, or one ticked-off occurrence of a recurring series. */
export interface Completion {
  id: string;
  title: string;
  day: Date;
  areaId: LifeAreaId | null;
  energy?: Energy;
  estimatedMinutes?: number;
  feeling?: Feeling;
  actualMinutes?: number;
}

/** A stored UTC-midnight date as a local-midnight Date on the same calendar day. */
function storedToLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function completionsOf(tasks: Task[]): Completion[] {
  const out: Completion[] = [];
  for (const task of tasks) {
    const base = {
      id: task.id,
      title: task.title,
      areaId: task.areaId ?? null,
      energy: task.energy,
      estimatedMinutes: task.estimatedMinutes,
    };
    if (task.recurrence) {
      for (const iso of task.completedDates ?? []) {
        const checkin = task.occurrenceCheckins?.[iso.slice(0, 10)];
        out.push({
          ...base,
          day: storedToLocalDay(iso),
          feeling: checkin?.feeling,
          actualMinutes: checkin?.actualMinutes,
        });
      }
    } else if (task.status === 'done' && task.completedAt) {
      out.push({
        ...base,
        day: startOfDay(new Date(task.completedAt)),
        feeling: task.feeling ?? undefined,
        actualMinutes: task.actualMinutes ?? undefined,
      });
    }
  }
  return out;
}

export interface Period {
  from: Date;
  to: Date;
}

/** Calendar week (Mon–Sun), month or year containing `now`. */
export function periodOf(range: InsightRange, now: Date): Period {
  const today = startOfDay(now);
  switch (range) {
    case 'week': {
      const from = startOfWeek(today);
      return { from, to: addDays(from, 6) };
    }
    case 'month':
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
    case 'year':
      return { from: new Date(today.getFullYear(), 0, 1), to: new Date(today.getFullYear(), 11, 31) };
  }
}

export function inPeriod(day: Date, { from, to }: Period): boolean {
  return day >= from && day <= to;
}

// ---------- 1. Streak ----------

export interface StreakInsight {
  current: number;
  best: number;
  /** Last 14 days, oldest first. */
  last14: { day: Date; done: boolean }[];
}

export function streakOf(completions: Completion[], now: Date): StreakInsight {
  const days = new Set(completions.map((c) => localISODate(c.day)));
  const today = startOfDay(now);
  // Today doesn't break the streak until midnight.
  let cursor = days.has(localISODate(today)) ? today : addDays(today, -1);
  let current = 0;
  for (; days.has(localISODate(cursor)); cursor = addDays(cursor, -1)) current++;

  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const day = new Date(`${iso}T00:00:00`);
    run = prev && localISODate(addDays(prev, 1)) === iso ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(today, i - 13);
    return { day, done: days.has(localISODate(day)) };
  });
  return { current, best, last14 };
}

// ---------- 2. Effort over time ----------

export interface EffortBucket {
  from: Date;
  to: Date;
  points: number;
  isCurrent: boolean;
}

export interface EffortInsight {
  buckets: EffortBucket[];
  total: number;
  /** Total minus the median week of the previous 8; week range only. */
  aboveMedian: number | null;
}

const sumPoints = (completions: Completion[], { from, to }: Period) =>
  completions.filter((c) => c.day >= from && c.day <= to).reduce((sum, c) => sum + effortPoints(c.estimatedMinutes), 0);

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Week → a slice per day; month → per week; year → per month. */
export function slicesOf(range: InsightRange, period: Period): Period[] {
  const slices: Period[] = [];
  switch (range) {
    case 'week':
      for (let d = period.from; d <= period.to; d = addDays(d, 1)) slices.push({ from: d, to: d });
      break;
    case 'month':
      for (let d = startOfWeek(period.from); d <= period.to; d = addDays(d, 7)) {
        slices.push({
          from: d < period.from ? period.from : d,
          to: addDays(d, 6) > period.to ? period.to : addDays(d, 6),
        });
      }
      break;
    case 'year':
      for (let m = 0; m < 12; m++) {
        slices.push({
          from: new Date(period.from.getFullYear(), m, 1),
          to: new Date(period.from.getFullYear(), m + 1, 0),
        });
      }
      break;
  }
  return slices;
}

export function effortOf(completions: Completion[], range: InsightRange, now: Date): EffortInsight {
  const today = startOfDay(now);
  const period = periodOf(range, today);
  const slices = slicesOf(range, period);
  const buckets = slices.map((s) => ({ ...s, points: sumPoints(completions, s), isCurrent: inPeriod(today, s) }));
  const total = buckets.reduce((sum, b) => sum + b.points, 0);

  let aboveMedian: number | null = null;
  if (range === 'week') {
    const previous = Array.from({ length: MEDIAN_WEEKS }, (_, i) => {
      const from = addDays(period.from, -7 * (i + 1));
      return sumPoints(completions, { from, to: addDays(from, 6) });
    });
    aboveMedian = total - median(previous);
  }
  return { buckets, total, aboveMedian };
}

// ---------- 3. Energy ----------

export function energyCounts(completions: Completion[]): Record<Energy, number> {
  const counts: Record<Energy, number> = { low: 0, medium: 0, high: 0 };
  for (const c of completions) if (c.energy) counts[c.energy]++;
  return counts;
}

// ---------- 4. Life area balance ----------

export interface AreaShare {
  areaId: LifeAreaId;
  count: number;
  percent: number;
}

/** Share of done tasks per life area, largest first; tasks without an area are left out. */
export function areaShares(completions: Completion[]): AreaShare[] {
  const counts = new Map<LifeAreaId, number>();
  for (const c of completions) if (c.areaId) counts.set(c.areaId, (counts.get(c.areaId) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts]
    .map(([areaId, count]) => ({ areaId, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

// ---------- 5. Burnout radar ----------

export interface BurnoutRow {
  areaId: LifeAreaId;
  /** Drained + Heavy, Neutral, Good + Great — percentages summing to ~100. */
  rose: number;
  neutral: number;
  good: number;
  checkins: number;
}

/** Rows are sorted by highest rose share, so the first one is the tip. */
export function burnoutRows(completions: Completion[]): BurnoutRow[] {
  const byArea = new Map<LifeAreaId, Feeling[]>();
  for (const c of completions) {
    if (c.areaId && c.feeling) byArea.set(c.areaId, [...(byArea.get(c.areaId) ?? []), c.feeling]);
  }
  return [...byArea]
    .filter(([, feelings]) => feelings.length >= BURNOUT_MIN_CHECKINS)
    .map(([areaId, feelings]) => {
      const share = (match: (f: Feeling) => boolean) => (feelings.filter(match).length / feelings.length) * 100;
      return {
        areaId,
        rose: share((f) => f === 'drained' || f === 'heavy'),
        neutral: share((f) => f === 'neutral'),
        good: share((f) => f === 'good' || f === 'great'),
        checkins: feelings.length,
      };
    })
    .sort((a, b) => b.rose - a.rose);
}

// ---------- 6. Expectation vs. reality ----------

export interface EffortGap {
  id: string;
  title: string;
  planned: number;
  actual: number;
  over: boolean;
}

/** The tasks with the biggest gap between estimate and logged time. */
export function effortGaps(completions: Completion[], limit = 3): EffortGap[] {
  return completions
    .filter((c) => c.estimatedMinutes && c.actualMinutes)
    .map((c) => ({
      id: c.id,
      title: c.title,
      planned: c.estimatedMinutes as number,
      actual: c.actualMinutes as number,
      over: (c.actualMinutes as number) > (c.estimatedMinutes as number),
    }))
    .sort((a, b) => Math.abs(b.actual - b.planned) - Math.abs(a.actual - a.planned))
    .slice(0, limit);
}

// ---------- 7. Vibe matrix ----------

export type MatrixColumn = 'drained' | 'neutral' | 'good' | 'great';
export const MATRIX_COLUMNS: MatrixColumn[] = ['drained', 'neutral', 'good', 'great'];

export type VibeMatrix = Record<Energy, Record<MatrixColumn, number>>;

/** Drained + Heavy share one column. */
export function vibeMatrix(completions: Completion[]): VibeMatrix {
  const matrix = Object.fromEntries(
    ENERGIES.map((e) => [e, { drained: 0, neutral: 0, good: 0, great: 0 }])
  ) as VibeMatrix;
  for (const c of completions) {
    if (!c.energy || !c.feeling) continue;
    const column: MatrixColumn = c.feeling === 'heavy' ? 'drained' : c.feeling;
    matrix[c.energy][column]++;
  }
  return matrix;
}

// ---------- 8. Habits ----------

export interface Habit {
  id: string;
  title: string;
  streak: number;
  atRisk: boolean;
}

/** Top repeating tasks by how many scheduled days in a row they were completed, counting back from the latest. */
export function habitStreaks(recurring: Task[], now: Date, limit = 3): Habit[] {
  const today = startOfDay(now);
  return recurring
    .map((task) => {
      const days = occurrencesBetween(task, addDays(today, -HABIT_LOOKBACK_DAYS), today).reverse();
      // Today's occurrence only counts once ticked; leaving it open isn't a miss yet.
      const settled =
        days[0] && days[0].getTime() === today.getTime() && !isOccurrenceDone(task, days[0]) ? days.slice(1) : days;
      const firstMiss = settled.findIndex((d) => !isOccurrenceDone(task, d));
      return {
        id: task.id,
        title: task.title,
        streak: firstMiss === -1 ? settled.length : firstMiss,
        atRisk: (task.missedDates ?? []).length > 0,
      };
    })
    .filter((h) => h.streak > 0 || h.atRisk)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, limit);
}

// ---------- 9. Vibe calendar ----------

export interface HeatCell {
  day: Date;
  /** Average feeling score that day, or null with no check-in. */
  score: number | null;
  /** False for padding days outside the month. */
  inRange: boolean;
  future: boolean;
  today: boolean;
}

/** 0 = no check-in, then four steps of green: <2, <3.5, <4.5, 4.5+. */
export function heatLevel(score: number | null): 0 | 1 | 2 | 3 | 4 {
  if (score === null) return 0;
  return score < 2 ? 1 : score < 3.5 ? 2 : score < 4.5 ? 3 : 4;
}

/** Week → 7 days; month → calendar grid; year → 52 weeks ending this week (columns are Mon–Sun). */
export function heatCells(completions: Completion[], range: InsightRange, now: Date): HeatCell[] {
  const today = startOfDay(now);
  const scores = new Map<string, number[]>();
  for (const c of completions) {
    if (!c.feeling) continue;
    const key = localISODate(c.day);
    scores.set(key, [...(scores.get(key) ?? []), FEELING_SCORE[c.feeling]]);
  }
  let days: { day: Date; inRange: boolean }[];
  switch (range) {
    case 'week': {
      const from = startOfWeek(today);
      days = Array.from({ length: 7 }, (_, i) => ({ day: addDays(from, i), inRange: true }));
      break;
    }
    case 'month':
      days = buildMonthGrid(today).map((c) => ({ day: c.date, inRange: c.isCurrentMonth }));
      break;
    case 'year': {
      const from = addDays(startOfWeek(today), -51 * 7);
      days = Array.from({ length: 52 * 7 }, (_, i) => ({ day: addDays(from, i), inRange: true }));
      break;
    }
  }
  return days.map(({ day, inRange }) => {
    const values = scores.get(localISODate(day));
    return {
      day,
      inRange,
      score: values ? values.reduce((a, b) => a + b, 0) / values.length : null,
      future: day > today,
      today: day.getTime() === today.getTime(),
    };
  });
}

// ---------- 10. Created vs. done by life area ----------

export interface CreatedDoneRow {
  areaId: LifeAreaId;
  created: number;
  done: number;
  /** done ÷ created, 0–100. */
  rate: number;
}

/**
 * Per life area: one-off tasks created in the period and how many of those are now done.
 * Recurring series are habits, not finishable work, so they aren't counted.
 */
export function createdVsDone(tasks: Task[], areaIds: LifeAreaId[], period: Period): CreatedDoneRow[] {
  const created = tasks.filter(
    (t) => !t.recurrence && t.areaId && t.createdAt && inPeriod(startOfDay(new Date(t.createdAt)), period)
  );
  return areaIds.map((areaId) => {
    const inArea = created.filter((t) => t.areaId === areaId);
    const done = inArea.filter((t) => t.status === 'done').length;
    return { areaId, created: inArea.length, done, rate: inArea.length ? Math.round((done / inArea.length) * 100) : 0 };
  });
}

// ---------- 11. Planned vs. done ----------

export interface PlannedSlice extends Period {
  planned: number;
  done: number;
  isCurrent: boolean;
  future: boolean;
}

export interface PlannedInsight {
  slices: PlannedSlice[];
  /** Planned and done up to today; hit rate is done ÷ planned (null with nothing planned). */
  planned: number;
  done: number;
  hitRate: number | null;
  /** Already planned for days still to come. */
  ahead: number;
  /** Today's plan, and whether it is the busiest day of the period (week and month only). */
  today: { planned: number; busiest: boolean } | null;
  /** Weekday (0 = Sunday) where planned most outruns done, with its daily averages. */
  gap: { weekday: number; planned: number; done: number } | null;
}

/** The local day a one-off task sits on the Today board (or is due on, while still open); done tasks never put on Today were unplanned. */
function plannedDayOf(task: Task): Date | null {
  const iso = task.status === 'done' ? task.todayDate : (task.todayDate ?? task.dueDate);
  return iso ? storedToLocalDay(iso) : null;
}

/** Tasks on each day's list (one-offs on that day + recurring occurrences) against tasks finished that day. */
export function plannedVsDone(
  tasks: Task[],
  completions: Completion[],
  range: InsightRange,
  now: Date
): PlannedInsight {
  const today = startOfDay(now);
  const period = periodOf(range, today);
  const oneOffDays = new Map<number, number>();
  for (const task of tasks) {
    const day = task.recurrence ? null : plannedDayOf(task);
    if (day) oneOffDays.set(day.getTime(), (oneOffDays.get(day.getTime()) ?? 0) + 1);
  }
  const series = tasks.filter((t) => t.recurrence);
  const doneByDay = new Map<number, number>();
  for (const c of completions) doneByDay.set(c.day.getTime(), (doneByDay.get(c.day.getTime()) ?? 0) + 1);

  const days: PlannedSlice[] = [];
  for (let d = period.from; d <= period.to; d = addDays(d, 1)) {
    days.push({
      from: d,
      to: d,
      planned:
        (oneOffDays.get(d.getTime()) ?? 0) + series.reduce((sum, t) => sum + occurrencesBetween(t, d, d).length, 0),
      done: doneByDay.get(d.getTime()) ?? 0,
      isCurrent: d.getTime() === today.getTime(),
      future: d > today,
    });
  }

  // Week and month show a bar pair per day; a year is too long for that, so it shows months.
  const slices: PlannedSlice[] =
    range === 'year'
      ? slicesOf(range, period).map((m) => {
          const inMonth = days.filter((d) => d.from >= m.from && d.from <= m.to);
          return {
            ...m,
            planned: inMonth.reduce((sum, d) => sum + d.planned, 0),
            done: inMonth.reduce((sum, d) => sum + d.done, 0),
            isCurrent: inPeriod(today, m),
            future: m.from > today,
          };
        })
      : days;

  const past = days.filter((d) => !d.future);
  const planned = past.reduce((sum, d) => sum + d.planned, 0);
  const done = past.reduce((sum, d) => sum + d.done, 0);

  // Weekday with the biggest average shortfall, from the days so far.
  const byWeekday = new Map<number, { planned: number; done: number; days: number }>();
  for (const d of past) {
    const row = byWeekday.get(d.from.getDay()) ?? { planned: 0, done: 0, days: 0 };
    byWeekday.set(d.from.getDay(), {
      planned: row.planned + d.planned,
      done: row.done + d.done,
      days: row.days + 1,
    });
  }
  let gap: PlannedInsight['gap'] = null;
  let worst = 0;
  for (const [weekday, row] of byWeekday) {
    const shortfall = (row.planned - row.done) / row.days;
    if (range !== 'year' && row.planned > 0 && shortfall > worst) {
      worst = shortfall;
      gap = { weekday, planned: Math.round(row.planned / row.days), done: Math.round(row.done / row.days) };
    }
  }

  const todayDay = range === 'year' ? undefined : days.find((d) => d.isCurrent);
  const todayPlan =
    todayDay && todayDay.planned > 0
      ? { planned: todayDay.planned, busiest: todayDay.planned >= Math.max(...days.map((d) => d.planned)) }
      : null;

  return {
    slices,
    planned,
    done,
    hitRate: planned ? Math.round((done / planned) * 100) : null,
    ahead: days.filter((d) => d.future).reduce((sum, d) => sum + d.planned, 0),
    today: todayPlan,
    gap,
  };
}
