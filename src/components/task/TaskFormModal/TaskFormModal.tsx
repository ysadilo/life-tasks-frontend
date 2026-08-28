import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useCreateTask, useUpdateTask, useDeleteTask, type TaskInput } from '../../../hooks/useTasks';
import { taskForm, useTaskFormState } from '../taskFormStore';
import { LIFE_AREAS } from '../../../lib/lifeAreas';
import type { LifeAreaId, Task, TaskStatus } from '../../../models';
import styles from './TaskFormModal.module.css';

/** Mount once (see AppShell); opened from anywhere via `taskForm.openNew()` / `taskForm.openEdit()`. */
export function TaskFormModal() {
  const { open, task } = useTaskFormState();
  const { t } = useTranslation();
  const onClose = taskForm.close;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('taskForm.close')}
      title={task ? t('taskForm.editTitle') : t('taskForm.newTitle')}
    >
      <TaskForm key={task?.id ?? 'new'} task={task} onClose={onClose} />
    </Modal>
  );
}

function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { t } = useTranslation();
  const isEdit = task != null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  const [area, setArea] = useState<LifeAreaId | ''>(task?.area ?? '');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;
  const failed = createTask.isError || updateTask.isError || deleteTask.isError;
  const trimmedTitle = title.trim();

  const buildInput = (status: TaskStatus): TaskInput => ({
    title: trimmedTitle,
    description: description.trim() || null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    area: area || null,
    status,
    todayDate: status === 'today' ? new Date().toISOString() : null,
  });

  const save = (status: TaskStatus) => {
    if (!trimmedTitle) return;
    if (isEdit) {
      updateTask.mutate({ id: task.id, ...buildInput(status) }, { onSuccess: onClose });
    } else {
      createTask.mutate(buildInput(status), { onSuccess: onClose });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save(isEdit ? task.status : 'today');
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Input
        autoFocus
        placeholder={t('taskForm.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={styles.textarea}
        rows={3}
        placeholder={t('taskForm.descriptionPlaceholder')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className={styles.field}>
        <span className={styles.label}>{t('taskForm.dueDate')}</span>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t('taskForm.area')}</span>
        <select className={styles.select} value={area} onChange={(e) => setArea(e.target.value as LifeAreaId | '')}>
          <option value="">{t('taskForm.areaNone')}</option>
          {LIFE_AREAS.map(({ id }) => (
            <option key={id} value={id}>
              {t(`lifeArea.${id}`)}
            </option>
          ))}
        </select>
      </label>

      {failed && <p className={styles.error}>{t('taskForm.error')}</p>}

      <div className={styles.footer}>
        {isEdit ? (
          <>
            <Button type="submit" variant="primary" disabled={pending || !trimmedTitle}>
              {t('taskForm.save')}
            </Button>
            <button
              type="button"
              className={styles.delete}
              disabled={pending}
              onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
            >
              {t('taskForm.delete')}
            </button>
          </>
        ) : (
          <>
            <Button type="submit" variant="primary" disabled={pending || !trimmedTitle}>
              {t('taskForm.addToToday')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || !trimmedTitle}
              onClick={() => save('backlog')}
            >
              {t('taskForm.parkInBacklog')}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
