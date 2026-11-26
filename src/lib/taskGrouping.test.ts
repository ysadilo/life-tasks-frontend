import { describe, expect, it } from 'vitest';
import { groupTasks, weekBucket } from './taskGrouping';
import type { Task } from '../models';

const task = (id: string, dueDate?: string) => ({ id, title: id, dueDate }) as Task;

describe('weekBucket', () => {
  // Thursday 26 Nov 2026; its Monday-based week runs 23–29 Nov.
  const today = new Date(2026, 10, 26);
  it.each([
    ['2026-11-25T00:00:00.000Z', 'earlier'],
    ['2026-11-26T00:00:00.000Z', 'thisWeek'],
    ['2026-11-29T00:00:00.000Z', 'thisWeek'],
    ['2026-11-30T00:00:00.000Z', 'nextWeek'],
    ['2026-12-06T00:00:00.000Z', 'nextWeek'],
    ['2026-12-07T00:00:00.000Z', 'later'],
    [undefined, null],
  ])('%s → %s', (due, bucket) => expect(weekBucket(task('t', due), today)).toBe(bucket));
});

describe('groupTasks by date', () => {
  it('sorts each group by date and puts undated tasks last', () => {
    const groups = groupTasks([task('none'), task('b', '2999-01-02'), task('a', '2999-01-01')], 'date', []);
    expect(groups.map((g) => [g.key, g.tasks.map((t) => t.id)])).toEqual([
      ['later', ['a', 'b']],
      ['none', ['none']],
    ]);
  });
});
