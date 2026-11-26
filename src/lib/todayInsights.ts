import { addDays, isSameDay, startOfDay, startOfWeek } from './dateUtils';
import type { Completion } from './insights';
import { hasOccurrenceOn } from './recurrence';
import { taskCalendarDate } from './taskDates';
import type { Task } from '../models';

const USUAL_WEEKS = 8;

const minutesOf = (c: Completion) => c.actualMinutes ?? c.estimatedMinutes ?? 0;

/** Average minutes finished on this weekday over the last 8 weeks, counting only days with something done; null without history. */
export function usualMinutesOn(completions: Completion[], day: Date): number | null {
  const totals: number[] = [];
  for (let week = 1; week <= USUAL_WEEKS; week++) {
    const past = addDays(startOfDay(day), -7 * week);
    const done = completions.filter((c) => isSameDay(c.day, past));
    if (done.length) totals.push(done.reduce((sum, c) => sum + minutesOf(c), 0));
  }
  return totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
}

/** Tasks finished on each day of this Monday-based week. */
export function doneByWeekday(completions: Completion[], today: Date): number[] {
  const monday = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => completions.filter((c) => isSameDay(c.day, addDays(monday, i))).length);
}

/** Backlog tasks dated tomorrow, then recurring series with an occurrence tomorrow. */
export function tasksForTomorrow(backlog: Task[], recurring: Task[], today: Date): Task[] {
  const tomorrow = addDays(startOfDay(today), 1);
  return [
    ...backlog.filter((task) => {
      const date = taskCalendarDate(task);
      return !!date && isSameDay(date, tomorrow);
    }),
    ...recurring.filter((task) => hasOccurrenceOn(task, tomorrow)),
  ];
}
