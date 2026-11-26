import { describe, expect, it } from 'vitest';
import type { Task } from '../models';
import { entryTime, splitDayEntries, type CalendarEntry } from './calendarEntries';

const entry = (id: string, extra: Partial<Task> = {}, done = false): CalendarEntry => ({
  key: id,
  date: new Date(2026, 7, 26),
  done,
  task: { id, title: id, description: null, dueDate: '2026-08-26', status: 'today', ...extra },
});

describe('splitDayEntries', () => {
  it('separates routines and puts done entries last', () => {
    const { tasks, routines } = splitDayEntries([
      entry('a', {}, true),
      entry('gym', { recurrence: 'daily' }),
      entry('b'),
    ]);
    expect(tasks.map((e) => e.key)).toEqual(['b', 'a']);
    expect(routines.map((e) => e.key)).toEqual(['gym']);
  });
});

describe('entryTime', () => {
  it('shows the reminder time only when it fires on the day', () => {
    expect(entryTime(entry('a', { notifyDaysBefore: 0, notifyTime: '18:00' }), 'en-GB')).toBe('18:00');
    expect(entryTime(entry('b', { notifyDaysBefore: 1, notifyTime: '18:00' }), 'en-GB')).toBeNull();
    expect(entryTime(entry('c'), 'en-GB')).toBeNull();
  });
});
