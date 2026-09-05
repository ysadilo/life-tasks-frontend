import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { toast } from '../../ui/Toast';
import { useCreateTask, useUpdateTask, useDeleteTask, type TaskInput } from '../../../hooks/useTasks';
import { taskForm, useTaskFormState } from '../taskFormStore';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { PRIORITIES } from '../../../lib/priority';
import { RECURRENCES } from '../../../lib/recurrence';
import { localISODate } from '../../../lib/dateUtils';
import { ENERGIES, EFFORT_MINUTES, energyRampKey, effortRampKey, priorityRampKey } from '../../../lib/taskMeta';
import type { Energy, LifeAreaId, Priority, Recurrence, Task, TaskStatus } from '../../../models';
import ramp from '../chipRamp.module.css';
import styles from './TaskFormModal.module.css';

interface Option {
  value: string;
  label: string;
  /** chipRamp.module.css class key; applied only when the option is selected. */
  rampKey?: string;
}

/** Row of single-select buttons; click the active one to clear. Matches the mockup's chip selectors. */
function OptionGroup({
  label,
  options,
  value,
  onChange,
  stretch = false,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  stretch?: boolean;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={[
                styles.option,
                stretch ? styles.optionStretch : '',
                selected ? styles.optionSelected : '',
                selected && option.rampKey ? ramp[option.rampKey] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(selected ? '' : option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mount once (see AppShell); opened from anywhere via `taskForm.openNew()` / `taskForm.openEdit()`. */
export function TaskFormModal() {
  const { open, task, presetDate } = useTaskFormState();
  const { t } = useTranslation();
  const onClose = taskForm.close;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('taskForm.close')}
      title={task ? t('taskForm.editTitle') : t('taskForm.newTitle')}
    >
      <TaskForm key={task?.id ?? presetDate ?? 'new'} task={task} presetDate={presetDate} onClose={onClose} />
    </Modal>
  );
}

function TaskForm({
  task,
  presetDate,
  onClose,
}: {
  task: Task | null;
  presetDate: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: lifeAreas } = useLifeAreas();
  const isEdit = task != null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : (presetDate ?? ''));
  const [area, setArea] = useState<LifeAreaId | ''>(task?.areaId ?? '');
  const [priority, setPriority] = useState<Priority | ''>(task?.priority ?? '');
  const [energy, setEnergy] = useState<Energy | ''>(task?.energy ?? '');
  const [effort, setEffort] = useState(task?.estimatedMinutes ? String(task.estimatedMinutes) : '');
  const [recurrence, setRecurrence] = useState<Recurrence | ''>(task?.recurrence ?? '');
  const [recurrenceEnd, setRecurrenceEnd] = useState(
    task?.recurrenceEndDate ? task.recurrenceEndDate.slice(0, 10) : ''
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;
  const failed = createTask.isError || updateTask.isError || deleteTask.isError;
  const trimmedTitle = title.trim();
  // A recurring task needs a start date to anchor the cadence (enforced by the BE too).
  const missingStart = !!recurrence && !dueDate;
  const blocked = pending || !trimmedTitle || missingStart;
  // A one-off task due today (or earlier) belongs on Today — the backlog option is off.
  const dueToday = !recurrence && !!dueDate && dueDate <= localISODate();

  const buildInput = (status: TaskStatus): TaskInput => ({
    title: trimmedTitle,
    description: description.trim() || null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    areaId: area || null,
    priority: priority || null,
    energy: energy || null,
    estimatedMinutes: effort ? Number(effort) : null,
    recurrence: recurrence || null,
    recurrenceEndDate: recurrence && recurrenceEnd ? new Date(recurrenceEnd).toISOString() : null,
    status,
    todayDate: status === 'today' ? new Date().toISOString() : null,
  });

  const save = (status: TaskStatus) => {
    if (blocked) return;
    const done = () => {
      if (recurrence) toast.show(t('taskForm.scheduledToast'));
      onClose();
    };
    if (isEdit) {
      updateTask.mutate({ id: task.id, ...buildInput(status) }, { onSuccess: done });
    } else {
      createTask.mutate(buildInput(status), { onSuccess: done });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save(recurrence ? 'backlog' : isEdit ? task.status : 'today');
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

      <OptionGroup
        stretch
        label={t('taskForm.priority')}
        value={priority}
        onChange={(v) => setPriority(v as Priority | '')}
        options={PRIORITIES.map((p) => ({ value: p, label: p, rampKey: priorityRampKey(p) }))}
      />

      <div className={styles.grid2}>
        <OptionGroup
          label={t('taskForm.effort')}
          value={effort}
          onChange={setEffort}
          options={EFFORT_MINUTES.map((m) => ({
            value: String(m),
            label: t(`taskForm.effortOption.${m}`),
            rampKey: effortRampKey(m),
          }))}
        />
        <OptionGroup
          label={t('taskForm.energy')}
          value={energy}
          onChange={(v) => setEnergy(v as Energy | '')}
          options={ENERGIES.map((e) => ({
            value: e,
            label: t(`taskForm.energyOption.${e}`),
            rampKey: energyRampKey(e),
          }))}
        />
      </div>

      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>{t('taskForm.area')}</span>
          <select className={styles.select} value={area} onChange={(e) => setArea(e.target.value as LifeAreaId | '')}>
            <option value="">{t('taskForm.areaNone')}</option>
            {lifeAreas?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{recurrence ? t('taskForm.startsOn') : t('taskForm.dueDate')}</span>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>

      <OptionGroup
        label={t('taskForm.recurrence')}
        value={recurrence}
        onChange={(v) => setRecurrence(v as Recurrence | '')}
        options={RECURRENCES.map((r) => ({ value: r, label: t(`taskForm.recurrenceOption.${r}`) }))}
      />
      {missingStart && <p className={styles.error}>{t('taskForm.startsOnRequired')}</p>}
      {recurrence && (
        <label className={styles.field}>
          <span className={styles.label}>{t('taskForm.recurrenceEnd')}</span>
          <Input
            type="date"
            value={recurrenceEnd}
            min={dueDate || undefined}
            onChange={(e) => setRecurrenceEnd(e.target.value)}
          />
        </label>
      )}

      {failed && <p className={styles.error}>{t('taskForm.error')}</p>}

      <div className={styles.footer}>
        {recurrence ? (
          <>
            <Button type="submit" variant="primary" disabled={blocked}>
              {isEdit ? t('taskForm.save') : t('taskForm.schedule')}
            </Button>
            {isEdit && (
              <div className={styles.footerRight}>
                <button
                  type="button"
                  className={styles.delete}
                  disabled={pending}
                  onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
                >
                  {t('taskForm.delete')}
                </button>
              </div>
            )}
          </>
        ) : isEdit ? (
          <>
            <Button type="submit" variant="primary" disabled={blocked}>
              {t('taskForm.save')}
            </Button>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.delete}
                disabled={pending}
                onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
              >
                {t('taskForm.delete')}
              </button>
              {task.status === 'done' ? (
                <Button type="button" variant="secondary" disabled={blocked} onClick={() => save('today')}>
                  {t('taskForm.markNotDone')}
                </Button>
              ) : (
                task.status !== 'backlog' && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={blocked || dueToday}
                    onClick={() => save('backlog')}
                  >
                    {t('taskForm.moveToBacklog')}
                  </Button>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <Button type="submit" variant="primary" disabled={blocked}>
              {t('taskForm.addToToday')}
            </Button>
            <Button type="button" variant="secondary" disabled={blocked || dueToday} onClick={() => save('backlog')}>
              {t('taskForm.parkInBacklog')}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
