import { lifeAreaColorVar } from './lifeAreas';
import { addDays, localISODate, startOfWeek } from './dateUtils';
import type { LifeArea, Task } from '../models';

export type GroupBy = 'area' | 'date';

export interface TaskGroup {
  key: string;
  /** i18n key for the heading, or null when `areaName` names it. */
  labelKey: string | null;
  areaName?: string;
  /** Swatch colour (life-area CSS var). */
  dot?: string;
  tasks: Task[];
}

type Bucket = Omit<TaskGroup, 'tasks'>;

const NO_VALUE = 'none';

export type WeekBucket = 'earlier' | 'thisWeek' | 'nextWeek' | 'later';
export const WEEK_BUCKETS: WeekBucket[] = ['earlier', 'thisWeek', 'nextWeek', 'later'];

/** Which planning week a task's date falls in (Monday-based); past days are `earlier`, no date is null. */
export function weekBucket(task: Task, today = new Date()): WeekBucket | null {
  if (!task.dueDate) return null;
  // Stored as UTC midnight, so the first 10 chars are the calendar day.
  const day = task.dueDate.slice(0, 10);
  if (day < localISODate(today)) return 'earlier';
  const weekStart = startOfWeek(today);
  if (day < localISODate(addDays(weekStart, 7))) return 'thisWeek';
  if (day < localISODate(addDays(weekStart, 14))) return 'nextWeek';
  return 'later';
}

function bucketsFor(by: GroupBy, areas: LifeArea[]): Bucket[] {
  switch (by) {
    case 'date':
      return [
        ...WEEK_BUCKETS.map((key) => ({ key, labelKey: `backlog.group.${key}` })),
        { key: NO_VALUE, labelKey: 'backlog.group.noDate' },
      ];
    case 'area':
      return [
        ...areas.map((a) => ({ key: a.id, labelKey: null, areaName: a.name, dot: lifeAreaColorVar(a.order) })),
        { key: NO_VALUE, labelKey: 'backlog.otherGroup' },
      ];
  }
}

function keyOf(task: Task, by: GroupBy): string {
  switch (by) {
    case 'date':
      return weekBucket(task) ?? NO_VALUE;
    case 'area':
      return task.areaId ?? NO_VALUE;
  }
}

/** Splits tasks into ordered, non-empty groups, each sorted by date (undated last, otherwise in given order). */
export function groupTasks(tasks: Task[], by: GroupBy, areas: LifeArea[]): TaskGroup[] {
  const byDate = [...tasks].sort((a, b) => (a.dueDate ?? '~').localeCompare(b.dueDate ?? '~'));
  const byKey = new Map<string, Task[]>();
  for (const task of byDate) {
    const key = keyOf(task, by);
    byKey.set(key, [...(byKey.get(key) ?? []), task]);
  }
  return bucketsFor(by, areas)
    .filter((bucket) => byKey.has(bucket.key))
    .map((bucket) => ({ ...bucket, tasks: byKey.get(bucket.key)! }));
}
