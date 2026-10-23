import type { Task } from '../models';

/** On a shared board you triage your own leftovers plus unassigned ones; the rest stay in their owner's triage. */
export function inMyTriage(task: Task, myId?: string): boolean {
  return !task.assigneeId || task.assigneeId === myId;
}
