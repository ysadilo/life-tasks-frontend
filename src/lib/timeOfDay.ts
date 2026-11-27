export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** Morning 5–12, afternoon 12–17, evening 17–22, night 22–5 (local hour, 0–23). */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
