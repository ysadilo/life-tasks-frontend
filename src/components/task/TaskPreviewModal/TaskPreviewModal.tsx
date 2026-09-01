import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { TaskRow } from '../TaskRow';
import { useCreateTask, useDeleteTask } from '../../../hooks/useTasks';
import { taskPreview, useTaskPreviewState } from '../taskPreviewStore';
import styles from './TaskPreviewModal.module.css';

/** Mount once (see AppShell); opened via `taskPreview.open(task)` for past calendar days. */
export function TaskPreviewModal() {
  const { open, task } = useTaskPreviewState();
  const { t } = useTranslation();
  const onClose = taskPreview.close;

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const pending = createTask.isPending || deleteTask.isPending;

  const copyToBacklog = () => {
    if (!task || pending) return;
    createTask.mutate(
      {
        title: task.title,
        description: task.description,
        area: task.area ?? null,
        priority: task.priority ?? null,
        energy: task.energy ?? null,
        estimatedMinutes: task.estimatedMinutes ?? null,
        status: 'backlog',
      },
      {
        onSuccess: () => {
          toast.show(t('taskPreview.copiedToast'));
          onClose();
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} closeLabel={t('taskForm.close')} title={t('taskPreview.title')}>
      {task && (
        <div className={styles.body}>
          <TaskRow task={task} />
          {(createTask.isError || deleteTask.isError) && <p className={styles.error}>{t('taskForm.error')}</p>}
          <div className={styles.footer}>
            <Button type="button" variant="primary" disabled={pending} onClick={copyToBacklog}>
              {t('taskPreview.copyToBacklog')}
            </Button>
            <button
              type="button"
              className={styles.delete}
              disabled={pending}
              onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
            >
              {t('taskForm.delete')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
