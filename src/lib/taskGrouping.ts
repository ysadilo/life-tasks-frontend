import { PRIORITIES } from './priority';
import { lifeAreaColorVar } from './lifeAreas';
import { ENERGIES } from './taskMeta';
import type { LifeArea, Task } from '../models';

export type GroupBy = 'area' | 'priority' | 'energy' | 'effort' | 'none';

export const GROUP_OPTIONS: GroupBy[] = ['area', 'priority', 'energy', 'effort', 'none'];

export interface TaskGroup {
  key: string;
  /** i18n key (with `labelValues`) for the heading, or the life area's own name; null = no heading. */
  labelKey: string | null;
  labelValues?: Record<string, string>;
  areaName?: string;
  /** Swatch colour (life-area CSS var). */
  dot?: string;
  tasks: Task[];
}

interface Bucket {
  key: string;
  labelKey: string | null;
  labelValues?: Record<string, string>;
  areaName?: string;
  dot?: string;
}

const NO_VALUE = 'none';
const EFFORT_BUCKETS = [
  { key: 'quick', max: 15 },
  { key: 'short', max: 60 },
  { key: 'long', max: Infinity },
];

function effortBucket(task: Task): string {
  if (task.estimatedMinutes == null) return NO_VALUE;
  return EFFORT_BUCKETS.find((b) => task.estimatedMinutes! <= b.max)!.key;
}

/** Ordered buckets for a grouping, ending with the catch-all for tasks lacking the field. */
function bucketsFor(by: Exclude<GroupBy, 'none'>, areas: LifeArea[]): Bucket[] {
  switch (by) {
    case 'area':
      return [
        ...areas.map((a) => ({ key: a.id, labelKey: null, areaName: a.name, dot: lifeAreaColorVar(a.order) })),
        { key: NO_VALUE, labelKey: 'backlog.otherGroup' },
      ];
    case 'priority':
      return [
        ...PRIORITIES.map((p) => ({ key: p, labelKey: 'backlog.group.priorityValue', labelValues: { value: p } })),
        { key: NO_VALUE, labelKey: 'backlog.group.noPriority' },
      ];
    case 'energy':
      return [
        ...ENERGIES.map((e) => ({ key: e, labelKey: `backlog.group.energyValue.${e}` })),
        { key: NO_VALUE, labelKey: 'backlog.group.noEnergy' },
      ];
    case 'effort':
      return [
        ...EFFORT_BUCKETS.map((b) => ({ key: b.key, labelKey: `backlog.group.effortValue.${b.key}` })),
        { key: NO_VALUE, labelKey: 'backlog.group.noEffort' },
      ];
  }
}

function keyOf(task: Task, by: Exclude<GroupBy, 'none'>): string {
  switch (by) {
    case 'area':
      return task.areaId ?? NO_VALUE;
    case 'priority':
      return task.priority ?? NO_VALUE;
    case 'energy':
      return task.energy ?? NO_VALUE;
    case 'effort':
      return effortBucket(task);
  }
}

/** Splits tasks into ordered, non-empty groups; task order within a group is preserved. */
export function groupTasks(tasks: Task[], by: GroupBy, areas: LifeArea[]): TaskGroup[] {
  if (by === 'none') return tasks.length ? [{ key: 'all', labelKey: null, tasks }] : [];
  const byKey = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = keyOf(task, by);
    byKey.set(key, [...(byKey.get(key) ?? []), task]);
  }
  return bucketsFor(by, areas)
    .filter((bucket) => byKey.has(bucket.key))
    .map((bucket) => ({ ...bucket, tasks: byKey.get(bucket.key)! }));
}
