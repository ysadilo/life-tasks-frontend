import type { Energy } from './Energy';
import type { Feeling } from './Feeling';
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
  areaId?: LifeAreaId | null;
  /** Board member the task is assigned to (shared boards); null/absent = anyone can take it. */
  assigneeId?: string | null;
  recurrence?: Recurrence | null;
  recurrenceEndDate?: string | null;
  /** Occurrence days (ISO) that have been ticked off, for a recurring series. */
  completedDates?: string[];
  /** Unresolved missed occurrence day(s) (ISO), surfaced in Triage. In practice holds at most one. */
  missedDates?: string[];
  /** Occurrence day(s) (ISO) forced onto Today outside the normal cadence. */
  extraTodayDates?: string[];
  completedAt?: string | null;
  /** Optional check-in captured when finishing the task ("Done + reflect"). */
  feeling?: Feeling | null;
  actualMinutes?: number | null;
}
