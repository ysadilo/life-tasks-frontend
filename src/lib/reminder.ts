import type { TFunction } from 'i18next';
import type { Task } from '../models';

type ReminderFields = Pick<Task, 'notifyDaysBefore' | 'notifyTime'>;

export const hasReminder = (task: ReminderFields) => task.notifyDaysBefore != null && !!task.notifyTime;

/** "9:00 AM · 1 day before", in the UI language; empty when the task has no reminder. */
export function reminderLabel(t: TFunction, task: ReminderFields, locale?: string): string {
  if (!hasReminder(task)) return '';
  const [h, m] = task.notifyTime!.split(':').map(Number);
  const time = new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  return `${time} · ${t('taskForm.notifyDaysBefore', { count: task.notifyDaysBefore! })}`;
}
