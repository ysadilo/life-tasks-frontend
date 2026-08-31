import type { Priority } from '../models/Priority';

export const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

export const PRIORITY_RANK: Record<Priority, number> = {
  P1: 0,
  P2: 1,
  P3: 2,
  P4: 3,
};
