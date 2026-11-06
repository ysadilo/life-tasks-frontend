import { describe, expect, it } from 'vitest';
import type { Task } from '../models';
import {
  areaShares,
  burnoutRows,
  completionsOf,
  createdVsDone,
  effortGaps,
  effortOf,
  effortPoints,
  heatLevel,
  periodOf,
  plannedVsDone,
  streakOf,
  vibeMatrix,
} from './insights';

const NOW = new Date(2026, 7, 26, 12); // Wed 26 Aug 2026

const done = (id: string, day: number, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  description: null,
  dueDate: null,
  status: 'done',
  completedAt: new Date(2026, 7, day, 10).toISOString(),
  ...extra,
});

describe('insights', () => {
  it('maps estimates to effort points', () => {
    expect([effortPoints(undefined), effortPoints(15), effortPoints(60), effortPoints(240)]).toEqual([0, 1, 2, 4]);
  });

  it('streak: today may be open, a gap ends it, best is kept', () => {
    const c = completionsOf([done('a', 25), done('b', 24), done('c', 23), done('d', 20), done('e', 19)]);
    const s = streakOf(c, NOW);
    expect(s.current).toBe(3); // 23–25, today (26) not yet done
    expect(s.best).toBe(3);
    expect(s.last14).toHaveLength(14);
  });

  it('recurring occurrences become completions with their check-in', () => {
    const series: Task = {
      id: 'r',
      title: 'Water',
      description: null,
      dueDate: '2026-08-01T00:00:00.000Z',
      status: 'backlog',
      recurrence: 'daily',
      completedDates: ['2026-08-24T00:00:00.000Z'],
      occurrenceCheckins: { '2026-08-24': { feeling: 'good', actualMinutes: 5 } },
    };
    const [c] = completionsOf([series]);
    expect(c.day).toEqual(new Date(2026, 7, 24));
    expect(c.feeling).toBe('good');
  });

  it('effort: week has 7 bars and reports difference from the median week', () => {
    const c = completionsOf([done('a', 24, { estimatedMinutes: 60 }), done('b', 26, { estimatedMinutes: 240 })]);
    const e = effortOf(c, 'week', NOW);
    expect(e.buckets).toHaveLength(7);
    expect(e.total).toBe(6);
    expect(e.aboveMedian).toBe(6); // empty previous weeks → median 0
    expect(e.buckets.filter((b) => b.isCurrent)).toHaveLength(1);
    expect(effortOf(c, 'year', NOW).buckets).toHaveLength(12);
  });

  it('area shares are sorted and rounded', () => {
    const c = completionsOf([
      done('a', 1, { areaId: 'x' }),
      done('b', 2, { areaId: 'x' }),
      done('c', 3, { areaId: 'y' }),
    ]);
    expect(areaShares(c).map((s) => [s.areaId, s.percent])).toEqual([
      ['x', 67],
      ['y', 33],
    ]);
  });

  it('burnout hides areas with fewer than 3 check-ins and puts the roughest first', () => {
    const f = (areaId: string, feeling: Task['feeling'], i: number) =>
      done(`${areaId}${i}`, 1 + i, { areaId, feeling });
    const c = completionsOf([
      f('a', 'drained', 0),
      f('a', 'heavy', 1),
      f('a', 'good', 2),
      f('b', 'great', 3),
      f('b', 'good', 4),
      f('b', 'neutral', 5),
      f('c', 'good', 6),
    ]);
    const rows = burnoutRows(c);
    expect(rows.map((r) => r.areaId)).toEqual(['a', 'b']);
    expect(Math.round(rows[0].rose)).toBe(67);
  });

  it('effort gaps rank by absolute difference', () => {
    const c = completionsOf([
      done('small', 1, { estimatedMinutes: 60, actualMinutes: 70 }),
      done('big', 2, { estimatedMinutes: 60, actualMinutes: 20 }),
      done('none', 3, { estimatedMinutes: 60 }),
    ]);
    const gaps = effortGaps(c);
    expect(gaps.map((g) => g.id)).toEqual(['big', 'small']);
    expect(gaps[0].over).toBe(false);
  });

  it('vibe matrix merges heavy into drained and skips incomplete tasks', () => {
    const c = completionsOf([
      done('a', 1, { energy: 'low', feeling: 'heavy' }),
      done('b', 2, { energy: 'low', feeling: 'drained' }),
      done('c', 3, { energy: 'high', feeling: 'great' }),
      done('d', 4, { energy: 'high' }),
    ]);
    const m = vibeMatrix(c);
    expect(m.low.drained).toBe(2);
    expect(m.high.great).toBe(1);
    expect(m.high.neutral).toBe(0);
  });

  it('heat levels step at 2 / 3.5 / 4.5', () => {
    expect([null, 1.5, 3, 4, 5].map(heatLevel)).toEqual([0, 1, 2, 3, 4]);
  });

  it('created vs done counts only tasks created in the period, per area', () => {
    const t = (id: string, created: string, status: Task['status']): Task => ({
      id,
      title: id,
      description: null,
      dueDate: null,
      status,
      areaId: 'x',
      createdAt: created,
    });
    const rows = createdVsDone(
      [
        t('a', '2026-08-03T10:00:00', 'done'),
        t('b', '2026-08-04T10:00:00', 'backlog'),
        t('old', '2026-07-01T10:00:00', 'done'),
      ],
      ['x', 'y'],
      periodOf('month', NOW)
    );
    expect(rows).toEqual([
      { areaId: 'x', created: 2, done: 1, rate: 50 },
      { areaId: 'y', created: 0, done: 0, rate: 0 },
    ]);
  });

  it('planned vs done: counts the day lists up to today, extras as done, future plans as ahead', () => {
    const open = (
      id: string,
      status: Task['status'],
      day: string,
      field: 'todayDate' | 'dueDate' = 'todayDate'
    ): Task => ({
      id,
      title: id,
      description: null,
      dueDate: field === 'dueDate' ? `${day}T00:00:00.000Z` : null,
      todayDate: field === 'todayDate' ? `${day}T00:00:00.000Z` : null,
      status,
    });
    const tasks = [
      open('plannedDone', 'done', '2026-08-24'),
      open('plannedMissed', 'needs_triage', '2026-08-24'),
      open('today', 'today', '2026-08-26'),
      open('later', 'backlog', '2026-08-28', 'dueDate'),
      done('extra', 25), // finished without ever being on a day's list
    ];
    tasks[0].completedAt = new Date(2026, 7, 24, 10).toISOString();
    const p = plannedVsDone(tasks, completionsOf(tasks), 'month', NOW);
    expect(p).toMatchObject({ planned: 3, done: 2, hitRate: 67, ahead: 1 });
    expect(p.slices.filter((s) => s.future).length).toBeGreaterThan(0);
    expect(p.gap?.weekday).toBe(1); // Monday the 24th: 2 planned, 1 done
  });
});
