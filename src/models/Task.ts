import type { Energy } from './Energy';
import type { LifeAreaId } from './LifeAreaId';
import type { Priority } from './Priority';
import type { Recurrence } from './Recurrence';
import type { TaskStatus } from './TaskStatus';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  todayDate?: string | null;
  status: TaskStatus;
  priority?: Priority;
  energy?: Energy;
  estimatedMinutes?: number;
  area?: LifeAreaId;
  recurrence?: Recurrence | null;
  recurrenceEndDate?: string | null;
  /** Occurrence days (ISO) that have been ticked off, for a recurring series. */
  completedDates?: string[];
  completedAt?: string | null;
}
