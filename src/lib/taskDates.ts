import type { Task } from '../models';

/** Calendar day (UTC parts) of a stored UTC-midnight date, as a ms key. */
function storedDayKey(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Calendar day of a local Date, as a ms key. */
function localDayKey(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * The day a task belongs on in the calendar, as a local-midnight Date:
 * - done  → the day it was completed
 * - on a board (todayDate set, incl. rolled over to triage) → that day
 * - otherwise → its due date
 * Null when none of those is set.
 */
export function taskCalendarDate(task: Task): Date | null {
  if (task.status === 'done') return task.completedAt ? new Date(task.completedAt) : null;
  const iso = task.todayDate ?? task.dueDate;
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * A task is overdue when its due date has passed and it isn't done. Recurring
 * tasks are never overdue — their date is a cadence anchor, not a deadline.
 */
export function isOverdue(task: Task, now = new Date()): boolean {
  if (task.status === 'done' || task.recurrence || task.dueDate == null) return false;
  return storedDayKey(task.dueDate) < localDayKey(now);
}

/** Days since a task was last scheduled for (its today-board date, falling back to due date). */
export function daysOverdue(task: Task, now = new Date()): number {
  const iso = task.todayDate ?? task.dueDate;
  if (!iso) return 0;
  return Math.round((localDayKey(now) - storedDayKey(iso)) / 86_400_000);
}

export type DueUrgency = 'overdue' | 'today' | 'tomorrow';

/**
 * How urgent a task's due date is, for highlighting tasks with one day or
 * less left. Null when there's nothing to flag: no due date, already done,
 * recurring (a cadence anchor, not a deadline), or due more than a day out.
 */
export function dueUrgency(task: Task, now = new Date()): DueUrgency | null {
  if (task.status === 'done' || task.recurrence || task.dueDate == null) return null;
  const daysUntil = Math.round((storedDayKey(task.dueDate) - localDayKey(now)) / 86_400_000);
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return null;
}
