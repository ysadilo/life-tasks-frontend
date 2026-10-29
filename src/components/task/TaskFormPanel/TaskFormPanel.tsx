import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '../../ui/SidePanel';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { DateField } from '../../ui/DateField';
import { RichTextEditor } from '../../ui/RichText';
import { toast } from '../../ui/Toast';
import { isBlankHtml } from '../../../lib/richText';
import { useCreateTask, useUpdateTask, useDeleteTask, type TaskInput } from '../../../hooks/useTasks';
import { taskForm, useTaskFormState } from '../taskFormStore';
import { leaveThen } from '../taskLeavingStore';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { useBoardMembers } from '../../../hooks/useBoards';
import { memberLabel } from '../../board';
import type { TaskDraft } from '../../../lib/quickAdd';
import { PRIORITIES } from '../../../lib/priority';
import { RECURRENCES, RECURRENCE_UNITS, MAX_CUSTOM_INTERVAL, isValidCustomInterval } from '../../../lib/recurrence';
import { localDayAsUTC, localISODate } from '../../../lib/dateUtils';
import { ENERGIES, EFFORT_MINUTES, energyRampKey, effortRampKey, priorityRampKey } from '../../../lib/taskMeta';
import type { Energy, LifeAreaId, Priority, Recurrence, RecurrenceUnit, Task, TaskStatus } from '../../../models';
import { OptionGroup } from '../OptionGroup';
import { PhotoImportButton } from '../PhotoImportButton';
import { TaskDetails } from '../TaskDetails';
import styles from './TaskFormPanel.module.css';

/**
 * Mount once (see AppShell, beside <main>); opened from anywhere via `taskForm.openNew()` / `openView()` / `openEdit()`.
 * `openView` shows the read-only details first, with an Edit button that switches to the form.
 */
const UNASSIGNED = 'unassigned';

export function TaskFormPanel() {
  const { open, task, presetDate, draft, mode } = useTaskFormState();
  const { t } = useTranslation();
  const onClose = taskForm.close;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      closeLabel={t('taskForm.close')}
      title={task ? t(mode === 'view' ? 'taskView.title' : 'taskForm.editTitle') : t('taskForm.newTitle')}
      headerAction={task ? undefined : <PhotoImportButton presetDate={presetDate} />}
    >
      {task && mode === 'view' ? (
        <TaskDetails key={task.id} task={task} onEdit={() => taskForm.openEdit(task)} />
      ) : (
        <TaskForm
          key={`${task?.id ?? ''}|${presetDate ?? ''}|${draft?.title ?? ''}`}
          task={task}
          presetDate={presetDate}
          draft={draft}
          onClose={onClose}
        />
      )}
    </SidePanel>
  );
}

function TaskForm({
  task,
  presetDate,
  draft,
  onClose,
}: {
  task: Task | null;
  presetDate: string | null;
  draft: TaskDraft | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: lifeAreas } = useLifeAreas();
  const board = useBoardMembers();
  const isEdit = task != null;

  const [title, setTitle] = useState(task?.title ?? draft?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? draft?.description ?? '');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : (presetDate ?? draft?.dueDate ?? '')
  );
  const [area, setArea] = useState<LifeAreaId | ''>(task?.areaId ?? draft?.areaId ?? '');
  // New tasks on a shared board start on the creator's plate; clicking the chip again hands it to anyone.
  const [assignee, setAssignee] = useState(task ? (task.assigneeId ?? '') : (board.me?.userId ?? ''));
  const [priority, setPriority] = useState<Priority | ''>(task?.priority ?? draft?.priority ?? '');
  const [energy, setEnergy] = useState<Energy | ''>(task?.energy ?? draft?.energy ?? '');
  const [effort, setEffort] = useState(
    task?.estimatedMinutes ? String(task.estimatedMinutes) : draft?.minutes ? String(draft.minutes) : ''
  );
  const [recurrence, setRecurrence] = useState<Recurrence | ''>(task?.recurrence ?? draft?.recurrence ?? '');
  const [interval, setInterval] = useState(task?.recurrenceInterval ? String(task.recurrenceInterval) : '1');
  const [unit, setUnit] = useState<RecurrenceUnit>(task?.recurrenceUnit ?? 'week');
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
  const custom = recurrence === 'custom';
  const badInterval = custom && !isValidCustomInterval(Number(interval));
  const blocked = pending || !trimmedTitle || missingStart || badInterval;
  // A one-off task due today (or earlier) belongs on Today — the backlog option is off.
  const dueToday = !recurrence && !!dueDate && dueDate <= localISODate();

  const buildInput = (status: TaskStatus): TaskInput => ({
    title: trimmedTitle,
    description: isBlankHtml(description) ? null : description,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    areaId: area || null,
    ...(board.shared ? { assigneeId: assignee || null } : {}),
    priority: priority || null,
    energy: energy || null,
    estimatedMinutes: effort ? Number(effort) : null,
    recurrence: recurrence || null,
    recurrenceInterval: custom ? Number(interval) : null,
    recurrenceUnit: custom ? unit : null,
    recurrenceEndDate: recurrence && recurrenceEnd ? new Date(recurrenceEnd).toISOString() : null,
    status,
    todayDate: status === 'today' ? localDayAsUTC() : null,
  });

  const save = (status: TaskStatus) => {
    if (blocked) return;
    if (isEdit && task.status === 'today' && status === 'backlog') {
      // Close first so the row's exit animation is visible, then move it.
      const input = { id: task.id, ...buildInput(status) };
      if (recurrence) toast.show(t('taskForm.scheduledToast'));
      onClose();
      void leaveThen(task.id, () => updateTask.mutateAsync(input));
      return;
    }
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
      <div className={styles.fields}>
        <Input
          autoFocus
          className={styles.titleInput}
          placeholder={t('taskForm.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className={styles.props}>
          <label className={styles.row}>
            <span className={styles.label}>{recurrence ? t('taskForm.startsOn') : t('taskForm.dueDate')}</span>
            <DateField value={dueDate} onChange={setDueDate} />
          </label>

          <OptionGroup
            row
            label={t('taskForm.priority')}
            value={priority}
            onChange={(v) => setPriority(v as Priority | '')}
            options={PRIORITIES.map((p) => ({ value: p, label: p, rampKey: priorityRampKey(p) }))}
          />
          <OptionGroup
            row
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
            row
            label={t('taskForm.energy')}
            value={energy}
            onChange={(v) => setEnergy(v as Energy | '')}
            options={ENERGIES.map((e) => ({
              value: e,
              label: t(`taskForm.energyOption.${e}`),
              rampKey: energyRampKey(e),
            }))}
          />

          <label className={styles.row}>
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

          {board.shared && (
            <OptionGroup
              row
              label={t('board.assignee')}
              value={assignee || UNASSIGNED}
              onChange={(v) => setAssignee(v === UNASSIGNED ? '' : v)}
              options={[
                ...board.members.map((m) => ({ value: m.userId, label: memberLabel(m, t) })),
                { value: UNASSIGNED, label: t('board.unassigned') },
              ]}
            />
          )}

          <OptionGroup
            row
            label={t('taskForm.recurrence')}
            value={recurrence}
            onChange={(v) => setRecurrence(v as Recurrence | '')}
            options={RECURRENCES.map((r) => ({ value: r, label: t(`taskForm.recurrenceOption.${r}`) }))}
          />
          {custom && (
            <div className={styles.row}>
              <span className={styles.label}>{t('taskForm.customEvery')}</span>
              <div className={styles.custom}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CUSTOM_INTERVAL}
                  className={styles.interval}
                  aria-label={t('taskForm.customEvery')}
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                />
                <select
                  className={styles.select}
                  aria-label={t('taskForm.customEvery')}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as RecurrenceUnit)}
                >
                  {RECURRENCE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t(`taskForm.customUnit.${u}`, { count: Number(interval) || 1 })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {recurrence && (
            <label className={styles.row}>
              <span className={styles.label}>{t('taskForm.recurrenceEnd')}</span>
              <DateField value={recurrenceEnd} min={dueDate || undefined} onChange={setRecurrenceEnd} />
            </label>
          )}
        </div>
        {missingStart && <p className={styles.error}>{t('taskForm.startsOnRequired')}</p>}
        {badInterval && (
          <p className={styles.error}>{t('taskForm.customIntervalInvalid', { max: MAX_CUSTOM_INTERVAL })}</p>
        )}

        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder={t('taskForm.descriptionPlaceholder')}
          ariaLabel={t('taskForm.descriptionPlaceholder')}
        />

        {failed && <p className={styles.error}>{t('taskForm.error')}</p>}
      </div>

      <div className={styles.footer}>
        {recurrence ? (
          isEdit ? (
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
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('taskForm.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={blocked}>
                {t('taskForm.schedule')}
              </Button>
            </>
          )
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
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('taskForm.cancel')}
            </Button>
            <div className={styles.footerRight}>
              <Button type="button" variant="secondary" disabled={blocked || dueToday} onClick={() => save('backlog')}>
                {t('taskForm.addToBacklog')}
              </Button>
              <Button type="submit" variant="primary" disabled={blocked}>
                {t('taskForm.addToToday')}
              </Button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
