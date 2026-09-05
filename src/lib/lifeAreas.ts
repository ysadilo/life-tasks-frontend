export const MAX_LIFE_AREAS = 10;

/** Palette slot cycles every 10 areas, assigned by creation order. */
export function lifeAreaColorVar(order: number): string {
  return `var(--color-area-${order % MAX_LIFE_AREAS})`;
}
