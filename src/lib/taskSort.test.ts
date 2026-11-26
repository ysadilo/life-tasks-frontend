import { describe, expect, it } from 'vitest';
import { sortTasks, toSortBy } from './taskSort';
import type { LifeArea, Task } from '../models';

const tasks = [
  { id: 'a', priority: 'P3', energy: 'low', areaId: 'work' },
  { id: 'b', energy: 'high', areaId: 'home' },
  { id: 'c', priority: 'P1' },
] as Task[];
const areas = [
  { id: 'home', order: 0 },
  { id: 'work', order: 1 },
] as LifeArea[];
const ids = (list: Task[]) => list.map((t) => t.id).join('');

describe('sortTasks', () => {
  it.each([
    ['manual', 'abc'],
    ['priority', 'cab'],
    ['energy', 'bac'],
    ['area', 'bac'],
  ] as const)('%s', (sortBy, expected) => {
    expect(ids(sortTasks(tasks, sortBy, areas))).toBe(expected);
  });

  it('falls back to priority for retired sorts', () => {
    expect(toSortBy('effort')).toBe('priority');
    expect(toSortBy('area')).toBe('area');
  });
});
