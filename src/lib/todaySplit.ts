import type { BoardMember, Task } from '../models';

export interface SplitRow {
  /** Null for the "Unassigned" row. */
  member: BoardMember | null;
  count: number;
  minutes: number;
}

/** Open Today work per member (you first), plus an Unassigned row when anything is unclaimed. */
export function splitByAssignee(tasks: Task[], members: BoardMember[]): SplitRow[] {
  const rows = new Map<string | null, SplitRow>(
    [...members]
      .sort((a, b) => Number(b.isMe) - Number(a.isMe))
      .map((m) => [m.userId, { member: m, count: 0, minutes: 0 }])
  );
  const unassigned: SplitRow = { member: null, count: 0, minutes: 0 };

  for (const task of tasks) {
    const row = (task.assigneeId && rows.get(task.assigneeId)) || unassigned;
    row.count += 1;
    row.minutes += task.estimatedMinutes ?? 0;
  }
  return [...rows.values(), ...(unassigned.count > 0 ? [unassigned] : [])];
}
