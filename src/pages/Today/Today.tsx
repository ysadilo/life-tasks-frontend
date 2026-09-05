import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageState } from '../../components/layout';
import { Button, EmptyState } from '../../components/ui';
import { TaskRow, DoneTaskRow, taskForm } from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus, useRecurringTasks, useToggleOccurrence } from '../../hooks/useTasks';
import { PRIORITY_RANK } from '../../lib/priority';
import { hasOccurrenceOn, isOccurrenceDone, occurrenceISO } from '../../lib/recurrence';
import { isSameDay } from '../../lib/dateUtils';
import type { Task } from '../../models';
import styles from './Today.module.css';

export default function Today() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: openTasks, isLoading, error } = useTasksByStatus('today');
  const { data: doneTasks } = useTasksByStatus('done');
  const { data: triageTasks } = useTasksByStatus('needs_triage');
  const { data: recurringTasks } = useRecurringTasks();
  const updateStatus = useUpdateTaskStatus();
  const toggleOccurrence = useToggleOccurrence();

  const [hideDone, setHideDone] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(true);

  const today = useMemo(() => new Date(), []);

  const toggle = (task: Task, done: boolean) => {
    if (task.recurrence) {
      toggleOccurrence.mutate({ id: task.id, date: occurrenceISO(today), done });
    } else {
      updateStatus.mutate({ id: task.id, status: done ? 'done' : 'today' });
    }
  };

  const recurringToday = useMemo(
    () => (recurringTasks ?? []).filter((task) => hasOccurrenceOn(task, today)),
    [recurringTasks, today]
  );

  const sortedOpenTasks = useMemo(() => {
    const tasks = [...(openTasks ?? []), ...recurringToday.filter((task) => !isOccurrenceDone(task, today))];
    if (sortByPriority) {
      tasks.sort(
        (a, b) => (a.priority ? PRIORITY_RANK[a.priority] : 99) - (b.priority ? PRIORITY_RANK[b.priority] : 99)
      );
    }
    return tasks;
  }, [openTasks, recurringToday, today, sortByPriority]);

  const doneToday = useMemo(() => {
    const oneOff = (doneTasks ?? []).filter((task) => task.completedAt && isSameDay(new Date(task.completedAt), today));
    const recurring = recurringToday.filter((task) => isOccurrenceDone(task, today));
    return [...oneOff, ...recurring];
  }, [doneTasks, recurringToday, today]);

  if (isLoading) return <PageState>{t('today.loading')}</PageState>;
  if (error) return <PageState>{t('today.error')}</PageState>;

  const totalCount = sortedOpenTasks.length + doneToday.length;
  const dateLabel = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('today.title')}
        subtitle={t('today.subtitle', { date: dateLabel, done: doneToday.length, total: totalCount })}
        actions={
          <>
            <Button variant="ghost">{t('today.filter')}</Button>
            <Button variant="ghost" onClick={() => setSortByPriority((v) => !v)}>
              {sortByPriority ? t('today.sortPriority') : t('today.sortDefault')}
            </Button>
            <Button variant="ghost" onClick={() => setHideDone((v) => !v)}>
              {hideDone ? t('today.showDone') : t('today.hideDone')}
            </Button>
          </>
        }
      />

      {!!triageTasks?.length && (
        <div className={styles.triageBanner}>
          <span>{t('today.triageBannerText', { count: triageTasks.length })}</span>
          <Button variant="primary" onClick={() => navigate('/triage')}>
            {t('today.startTriage')}
          </Button>
        </div>
      )}

      <div className={styles.list}>
        {sortedOpenTasks.length === 0 && doneToday.length === 0 && (
          <EmptyState
            title={t('today.emptyTitle')}
            description={t('today.emptyDescription')}
            action={
              <Button variant="primary" onClick={() => taskForm.openNew()}>
                {t('sidebar.newTask')}
              </Button>
            }
          />
        )}

        {sortedOpenTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => toggle(task, true)}
            onEdit={() => taskForm.openEdit(task)}
          />
        ))}

        {!hideDone && doneToday.length > 0 && (
          <>
            <div className={styles.doneDivider}>
              <span className={styles.doneDividerLabel}>{t('today.doneToday')}</span>
              <span className={styles.doneDividerRule} />
              <span className={styles.doneDividerCount}>{doneToday.length}</span>
            </div>
            {doneToday.map((task) => (
              <DoneTaskRow
                key={task.id}
                task={task}
                onToggle={() => toggle(task, false)}
                onEdit={() => taskForm.openEdit(task)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
