import type { Energy, Priority } from '../models';

export const ENERGIES: Energy[] = ['low', 'medium', 'high'];

/** Effort presets offered in the task form, in minutes. */
export const EFFORT_MINUTES = [15, 60, 240];

/** CSS-module class keys in `chipRamp.module.css` for each meta value. */
export type ChipRampKey =
  | 'priorityP1'
  | 'priorityP2'
  | 'priorityP3'
  | 'priorityP4'
  | 'energyLow'
  | 'energyMed'
  | 'energyHigh'
  | 'effortXs'
  | 'effortSm'
  | 'effortMd';

export function priorityRampKey(priority: Priority): ChipRampKey {
  return `priority${priority}`;
}

export function energyRampKey(energy: Energy): ChipRampKey {
  return energy === 'low' ? 'energyLow' : energy === 'medium' ? 'energyMed' : 'energyHigh';
}

export function effortRampKey(minutes: number): ChipRampKey {
  return minutes <= 15 ? 'effortXs' : minutes <= 60 ? 'effortSm' : 'effortMd';
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h ${minutes % 60}m`;
}
