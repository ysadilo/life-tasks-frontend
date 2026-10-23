import type { Task } from '../models';

export const ASSIGNEE_VIEWS = ['mine', 'everyone', 'unassigned'] as const;
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
