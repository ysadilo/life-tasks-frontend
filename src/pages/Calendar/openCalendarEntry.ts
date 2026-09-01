import { taskForm, taskPreview } from '../../components/task';
import { startOfDay } from '../../lib/dateUtils';
import type { CalendarEntry } from '../../lib/calendarEntries';

/**
 * Click a calendar task: a past day opens the read-only preview (copy/delete only),
 * today or a future day opens the normal edit modal.
 */
export function openCalendarEntry(entry: CalendarEntry) {
  if (entry.date < startOfDay(new Date())) taskPreview.open(entry.task);
  else taskForm.openEdit(entry.task);
}
