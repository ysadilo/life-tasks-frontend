export type ActivityType = 'added' | 'finished' | 'assigned';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  taskTitle: string;
  actorId: string;
  actorEmail: string;
  /** For `assigned`: who got the task; null = it was unassigned. */
  targetUserId: string | null;
  targetEmail: string | null;
  createdAt: string;
}
