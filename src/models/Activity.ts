export type ActivityType = 'added' | 'finished' | 'assigned';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  taskTitle: string;
  /** Null for entries from before links existed; the task may also have been deleted since. */
  taskId: string | null;
  actorId: string;
  actorEmail: string;
  /** For `assigned`: who got the task; null = it was unassigned. */
  targetUserId: string | null;
  targetEmail: string | null;
  createdAt: string;
}
