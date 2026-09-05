import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageState } from '../../components/layout';
import { Button, EmptyState } from '../../components/ui';
import {
  TaskRow,
  DoneTaskRow,
  taskForm,
  TaskFilterPopover,
  EMPTY_TASK_FILTERS,
  activeFilterCount,
  matchesFilters,
  TaskSortPopover,
  SORT_COMPARATORS,
  type TaskFilters,
  type SortBy,
} from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus, useRecurringTasks, useToggleOccurrence } from '../../hooks/useTasks';
import { useManualOrder } from '../../hooks/useManualOrder';
import { useDragReorder } from '../../hooks/useDragReorder';
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
  const manualOrder = useManualOrder();

  const [hideDone, setHideDone] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

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
    if (sortBy === 'manual') return manualOrder.applyOrder(tasks);
    const comparator = SORT_COMPARATORS[sortBy];
    if (comparator) tasks.sort(comparator);
    return tasks;
  }, [openTasks, recurringToday, today, sortBy, manualOrder.applyOrder]);

  const doneToday = useMemo(() => {
    const oneOff = (doneTasks ?? []).filter((task) => task.completedAt && isSameDay(new Date(task.completedAt), today));
    const recurring = recurringToday.filter((task) => isOccurrenceDone(task, today));
    return [...oneOff, ...recurring];
  }, [doneTasks, recurringToday, today]);

  const filteredOpenTasks = useMemo(
    () => sortedOpenTasks.filter((task) => matchesFilters(task, filters)),
    [sortedOpenTasks, filters]
  );
  const filteredDoneToday = useMemo(
    () => doneToday.filter((task) => matchesFilters(task, filters)),
    [doneToday, filters]
  );
  const filterCount = activeFilterCount(filters);

  const openTaskIds = useMemo(() => filteredOpenTasks.map((task) => task.id), [filteredOpenTasks]);
  const dragReorder = useDragReorder(openTaskIds, manualOrder.reorder);
  const displayedOpenTasks = useMemo(() => {
    if (sortBy !== 'manual') return filteredOpenTasks;
    const byId = new Map(filteredOpenTasks.map((task) => [task.id, task]));
    return dragReorder.order.map((id) => byId.get(id)).filter((task): task is Task => !!task);
  }, [sortBy, filteredOpenTasks, dragReorder.order]);

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
            <div className={styles.filterWrap}>
              <Button variant="ghost" onClick={() => setFilterOpen((v) => !v)}>
                {filterCount > 0 ? `${t('today.filter')} · ${filterCount}` : t('today.filter')}
              </Button>
              {filterOpen && (
                <TaskFilterPopover
                  filters={filters}
                  onChange={setFilters}
                  matchCount={filteredOpenTasks.length + filteredDoneToday.length}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </div>
            <div className={styles.sortWrap}>
              <Button variant="ghost" onClick={() => setSortOpen((v) => !v)}>
                {t('today.sort.label', { mode: t(`today.sort.${sortBy}`) })}
              </Button>
              {sortOpen && <TaskSortPopover sortBy={sortBy} onChange={setSortBy} onClose={() => setSortOpen(false)} />}
            </div>
            <Button variant="ghost" onClick={() => setHideDone((v) => !v)}>
              {hideDone ? t('today.showDone') : t('today.hideDone')}
            </Button>
          </>
        }
      />

      {!!triageTasks?.length && (
        <div className={styles.triageBanner}>
          <span>{t('today.triageBannerText', { count: triageTasks.length })}</span>
          <Button variant="primary" className={styles.triageBannerAction} onClick={() => navigate('/triage')}>
            {t('today.startTriage')}
          </Button>
        </div>
      )}

      <div className={styles.list}>
        {displayedOpenTasks.length === 0 && filteredDoneToday.length === 0 && (
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

        {displayedOpenTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => toggle(task, true)}
            onEdit={() => taskForm.openEdit(task)}
            rowRef={sortBy === 'manual' ? dragReorder.registerRow(task.id) : undefined}
            dragHandleProps={
              sortBy === 'manual'
                ? { dragging: dragReorder.draggingId === task.id, ...dragReorder.dragHandleProps(task.id) }
                : undefined
            }
          />
        ))}

        {!hideDone && filteredDoneToday.length > 0 && (
          <>
            <div className={styles.doneDivider}>
              <span className={styles.doneDividerLabel}>{t('today.doneToday')}</span>
              <span className={styles.doneDividerRule} />
              <span className={styles.doneDividerCount}>{filteredDoneToday.length}</span>
            </div>
            {filteredDoneToday.map((task) => (
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
