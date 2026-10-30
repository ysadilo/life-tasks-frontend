import type { Task } from '../models';

export const ASSIGNEE_VIEWS = ['everyone', 'mine', 'unassigned'] as const;
export type AssigneeView = (typeof ASSIGNEE_VIEWS)[number];

export function matchesAssigneeView(task: Task, view: AssigneeView, myId?: string): boolean {
  switch (view) {
    case 'mine':
      return !!myId && task.assigneeId === myId;
    case 'unassigned':
      return !task.assigneeId;
    case 'everyone':
      return true;
  }
}

/** On a shared board only the assignee may complete / reflect on a task; unassigned tasks are open to everyone. */
export function canActOn(task: Task, shared: boolean, myId?: string): boolean {
  return !shared || !task.assigneeId || task.assigneeId === myId;
}
