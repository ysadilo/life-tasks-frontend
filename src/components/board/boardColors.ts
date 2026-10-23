import { lifeAreaColorVar } from '../../lib/lifeAreas';

/** Stable pastel per board / member, picked from the life-area palette. */
export function colorFor(key: string): string {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return lifeAreaColorVar(hash % 10);
}

export const initialOf = (text: string) => text.trim().charAt(0).toUpperCase() || '?';
