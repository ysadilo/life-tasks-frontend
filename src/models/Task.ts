import type { LifeAreaId } from './LifeAreaId';
import type { Priority } from './Priority';
import type { TaskStatus } from './TaskStatus';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority?: Priority;
  estimatedMinutes?: number;
  area?: LifeAreaId;
  completedAt?: string | null;
}
