import type { TFunction } from 'i18next';
import type { Task } from '../models';
import type { Recurrence, RecurrenceUnit } from '../models/Recurrence';

/** Recurrence options offered in the task form, in the order shown. `custom` opens the interval + unit fields. */
export const RECURRENCES: Recurrence[] = ['daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom'];

export const RECURRENCE_UNITS: RecurrenceUnit[] = ['day', 'week', 'month'];

/** Largest custom interval; the BE rejects anything above it. */
export const MAX_CUSTOM_INTERVAL = 365;

export function isValidCustomInterval(interval: number): boolean {
  return Number.isInteger(interval) && interval >= 1 && interval <= MAX_CUSTOM_INTERVAL;
}

/** "Every week", "Every 3 days" — the cadence of a recurring task, in words. */
export function recurrenceLabel(
  t: TFunction,
  task: Pick<Task, 'recurrence' | 'recurrenceInterval' | 'recurrenceUnit'>
): string {
  if (task.recurrence === 'custom') {
    return t(`taskForm.customSchedule.${task.recurrenceUnit ?? 'day'}`, { count: task.recurrenceInterval ?? 1 });
  }
  return t(`taskForm.recurrenceOption.${task.recurrence}`);
}

const DAY = 86_400_000;

/** UTC-midnight of the calendar day a stored ISO date refers to (stored UTC-midnight). */
function fromStored(value: string): Date {
  return new Date(value.slice(0, 10) + 'T00:00:00.000Z');
}

/** UTC-midnight key for the wall-clock (local) day of a Date — today, a calendar cell. */
function fromLocal(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function matchesCustom(day: Date, start: Date, interval: number, unit: RecurrenceUnit): boolean {
  const diffDays = Math.round((day.getTime() - start.getTime()) / DAY);
  switch (unit) {
    case 'day':
      return diffDays % interval === 0;
    case 'week':
      return diffDays % (7 * interval) === 0;
    case 'month': {
      const months = (day.getUTCFullYear() - start.getUTCFullYear()) * 12 + day.getUTCMonth() - start.getUTCMonth();
      // ponytail: like `monthly`, a series anchored on the 29th–31st skips months that are shorter.
      return day.getUTCDate() === start.getUTCDate() && months % interval === 0;
    }
  }
}

function matchesRule(day: Date, start: Date, task: Task, r: Recurrence): boolean {
  const diffDays = Math.round((day.getTime() - start.getTime()) / DAY);
  switch (r) {
    case 'daily':
      return true;
    case 'weekdays':
      return day.getUTCDay() >= 1 && day.getUTCDay() <= 5;
    case 'weekly':
      return diffDays % 7 === 0;
    case 'biweekly':
      return diffDays % 14 === 0;
    case 'monthly':
      // ponytail: a series anchored on the 29th–31st skips months that are shorter.
      return day.getUTCDate() === start.getUTCDate();
    case 'custom':
      return matchesCustom(day, start, task.recurrenceInterval ?? 1, task.recurrenceUnit ?? 'day');
  }
}

/** `d` is a UTC-midnight day key. */
function occursOn(task: Task, d: Date): boolean {
  if (!task.recurrence || !task.dueDate) return false;
  const start = fromStored(task.dueDate);
  if (d < start) return false;
  if (task.recurrenceEndDate && d > fromStored(task.recurrenceEndDate)) return false;
  return matchesRule(d, start, task, task.recurrence);
}

/** Does the recurring series have an occurrence on `day` (a local wall-clock day) —
 *  by its normal cadence, or forced in via a Triage "add to today" resolution? */
export function hasOccurrenceOn(task: Task, day: Date): boolean {
  const d = fromLocal(day);
  if (occursOn(task, d)) return true;
  return (task.extraTodayDates ?? []).some((iso) => fromStored(iso).getTime() === d.getTime());
}

/** Occurrence days of a recurring series within [from, to], as local-midnight Dates. */
export function occurrencesBetween(task: Task, from: Date, to: Date): Date[] {
  if (!task.recurrence || !task.dueDate) return [];
  const out: Date[] = [];
  const end = fromLocal(to);
  const cursor = fromLocal(from);
  let guard = 0;
  while (cursor <= end && guard++ < 500) {
    if (occursOn(task, cursor)) {
      out.push(new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** Has this occurrence day been ticked off? */
export function isOccurrenceDone(task: Task, day: Date): boolean {
  const t = fromLocal(day).getTime();
  return (task.completedDates ?? []).some((d) => fromStored(d).getTime() === t);
}

/** The `YYYY-MM-DD` to send as `occurrenceDate` for a given local day. */
export function occurrenceISO(day: Date): string {
  return fromLocal(day).toISOString().slice(0, 10);
}

/** Recurring series with an occurrence on `day` that hasn't been ticked off yet. */
export function openRecurringOn(tasks: Task[] | undefined, day: Date): Task[] {
  return (tasks ?? []).filter((task) => hasOccurrenceOn(task, day) && !isOccurrenceDone(task, day));
}
