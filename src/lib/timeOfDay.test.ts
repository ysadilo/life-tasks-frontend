import { describe, expect, it } from 'vitest';
import { timeOfDay } from './timeOfDay';

describe('timeOfDay', () => {
  it('splits the day at 5, 12, 17 and 22', () => {
    expect([4, 5, 11, 12, 16, 17, 21, 22, 0].map(timeOfDay)).toEqual([
      'night',
      'morning',
      'morning',
      'afternoon',
      'afternoon',
      'evening',
      'evening',
      'night',
      'night',
    ]);
  });
});
