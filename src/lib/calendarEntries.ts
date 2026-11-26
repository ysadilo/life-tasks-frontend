import type { Task } from '../models';
import { isOccurrenceDone, occurrencesBetween } from './recurrence';
import { taskCalendarDate } from './taskDates';

export interface CalendarEntry {
  key: string;
  date: Date;
  task: Task;
  done: boolean;
}

/**
 * Flattens tasks into one entry per calendar cell: a recurring series expands to
 * one entry per occurrence day in [from, to]; a one-off task gets a single entry
 * on its completion day (if done) or its due date.
 */
export function buildCalendarEntries(tasks: Task[], from: Date, to: Date): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  for (const task of tasks) {
    if (task.recurrence) {
      for (const date of occurrencesBetween(task, from, to)) {
        entries.push({
          key: `${task.id}:${date.toISOString().slice(0, 10)}`,
          date,
          task,
          done: isOccurrenceDone(task, date),
        });
      }
    } else {
      const date = taskCalendarDate(task);
      if (date) entries.push({ key: task.id, date, task, done: task.status === 'done' });
    }
  }
  return entries;
}

/** Splits a day's entries into one-off tasks (open first, done last) and recurring "routines". */
export function splitDayEntries(entries: CalendarEntry[]): { tasks: CalendarEntry[]; routines: CalendarEntry[] } {
  const byDone = (a: CalendarEntry, b: CalendarEntry) => Number(a.done) - Number(b.done);
  return {
    tasks: entries.filter((entry) => !entry.task.recurrence).sort(byDone),
    routines: entries.filter((entry) => entry.task.recurrence).sort(byDone),
  };
}

/** The entry's time of day: its reminder time when the reminder fires on that day, else null ("any time"). */
export function entryTime(entry: CalendarEntry, locale: string): string | null {
  const { notifyDaysBefore, notifyTime } = entry.task;
  if (notifyDaysBefore !== 0 || !notifyTime) return null;
  const [h, m] = notifyTime.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}
