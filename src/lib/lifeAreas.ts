import type { LifeAreaId } from '../models/LifeAreaId';

export interface LifeAreaMeta {
  id: LifeAreaId;
}

export const LIFE_AREAS: LifeAreaMeta[] = [
  { id: 'home' },
  { id: 'health' },
  { id: 'money' },
  { id: 'social' },
  { id: 'admin' },
];

export function lifeAreaColorVar(id: LifeAreaId): string {
  return `var(--color-area-${id})`;
}
