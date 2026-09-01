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
