import { describe, expect, it } from 'vitest';
import { doneByWeekday, tasksForTomorrow, usualMinutesOn } from './todayInsights';
import type { Completion } from './insights';
import type { Task } from '../models';

// Thursday 26 Nov 2026.
const today = new Date(2026, 10, 26);
const done = (day: Date, minutes: number) => ({ day, estimatedMinutes: minutes }) as Completion;

describe('usualMinutesOn', () => {
  it('averages earlier same weekdays that had work', () => {
    const history = [
      done(new Date(2026, 10, 19), 60),
      done(new Date(2026, 10, 19), 30),
      done(new Date(2026, 10, 12), 30),
      done(new Date(2026, 10, 25), 500), // a Wednesday: ignored
      done(today, 500), // today itself: ignored
    ];
    expect(usualMinutesOn(history, today)).toBe(60);
  });

  it('is null without history', () => {
    expect(usualMinutesOn([], today)).toBeNull();
  });
});

describe('doneByWeekday', () => {
  it('counts Monday to Sunday of this week', () => {
    const history = [done(new Date(2026, 10, 23), 0), done(today, 0), done(today, 0), done(new Date(2026, 10, 22), 0)];
    expect(doneByWeekday(history, today)).toEqual([1, 0, 0, 2, 0, 0, 0]);
  });
});

describe('tasksForTomorrow', () => {
  it('keeps backlog tasks dated tomorrow', () => {
    const backlog = [
      { id: 'a', status: 'backlog', dueDate: '2026-11-27T00:00:00.000Z' },
      { id: 'b', status: 'backlog', dueDate: '2026-11-28T00:00:00.000Z' },
      { id: 'c', status: 'backlog', dueDate: null },
    ] as Task[];
    expect(tasksForTomorrow(backlog, [], today).map((t) => t.id)).toEqual(['a']);
  });
});
