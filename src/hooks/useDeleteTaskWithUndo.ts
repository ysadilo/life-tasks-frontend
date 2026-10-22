import { useTranslation } from 'react-i18next';
import { toast } from '../components/ui/Toast';
import { taskToInput, useCreateTask, useDeleteTask } from './useTasks';
import type { Task } from '../models';

/**
 * Deletes a task, then offers an Undo toast.
 * ponytail: undo re-creates the task (new id; completed occurrences of a recurring series are lost),
 * the same lazy inverse Triage uses — add soft-delete on the BE if undo must restore the exact row.
 */
export function useDeleteTaskWithUndo() {
  const { t } = useTranslation();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  return async (task: Task) => {
    await deleteTask.mutateAsync(task.id);
    toast.show(t('task.deletedToast', { title: task.title }), {
      label: t('task.undo'),
      onClick: () => createTask.mutate({ ...taskToInput(task), status: task.status, todayDate: task.todayDate }),
    });
  };
}
