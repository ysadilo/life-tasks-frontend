import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageState } from '../../components/layout';
import { useBoardMembers } from '../../hooks/useBoards';
import { TodayRail } from '../../components/board';
import { Button, EmptyState, peek, SamoyedAvatar, SamoyedMoment, SegmentedTabs } from '../../components/ui';
import {
  TaskRow,
  DoneTaskRow,
  ReflectModal,
  type Reflection,
  taskForm,
  AppliedFilters,
  TaskFilterPopover,
  EMPTY_TASK_FILTERS,
  activeFilterCount,
  matchesFilters,
  TaskSortPopover,
  SORT_COMPARATORS,
  type TaskFilters,
} from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus, useRecurringTasks, useToggleOccurrence } from '../../hooks/useTasks';
import { useDeleteTaskWithUndo } from '../../hooks/useDeleteTaskWithUndo';
import { usePreferences } from '../../hooks/usePreferences';
import { useManualOrder } from '../../hooks/useManualOrder';
import { useDragReorder } from '../../hooks/useDragReorder';
import { hasOccurrenceOn, isOccurrenceDone, occurrenceISO } from '../../lib/recurrence';
import { isSameDay } from '../../lib/dateUtils';
import { dueUrgency } from '../../lib/taskDates';
import { inMyTriage } from '../../lib/triageScope';
import { ASSIGNEE_VIEWS, matchesAssigneeView, type AssigneeView } from '../../lib/assigneeView';
import { bump, getSamoyedMode, tryAppear, welcomeBack, type MomentId } from '../../lib/samoyed';
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
  const deleteTask = useDeleteTaskWithUndo();
  const toggleOccurrence = useToggleOccurrence();
  const manualOrder = useManualOrder();

  const { shared, me } = useBoardMembers();
  const [assigneeView, setAssigneeView] = useState<AssigneeView>('mine');
  const [hideDone, setHideDone] = useState(false);
  const { preferences, update: updatePreferences } = usePreferences();
  const sortBy = preferences.todaySortBy;
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(true);
  const samoyedMode = getSamoyedMode();
  // tryAppear/welcomeBack are idempotent within a page load, so StrictMode and remounts keep the same answer.
  const [greeting] = useState<MomentId | null>(() => {
    if (welcomeBack()) return 'welcomeBack';
    return new Date().getHours() >= 23 && tryAppear('lateNight') ? 'lateNight' : null;
  });
  const [reflecting, setReflecting] = useState<Task | null>(null);

  const today = useMemo(() => new Date(), []);

  const toggle = (task: Task, done: boolean) => {
    if (done) {
      const milestone = bump('done');
      if (milestone) peek.show(milestone);
    }
    if (task.recurrence) {
      toggleOccurrence.mutate({ id: task.id, date: occurrenceISO(today), done });
    } else {
      updateStatus.mutate({ id: task.id, status: done ? 'done' : 'today' });
    }
  };

  // Recurring rows are virtual occurrences, so they can't be deleted or moved per day (swiping explains that). The BE would
  // promote a due-today task straight back to Today, so those can't be sent to the backlog either.
  const swipeFor = (task: Task) => {
    if (task.recurrence) {
      return {
        left: { label: t('task.swipe.cantDelete'), tone: 'blocked' as const },
        right: { label: t('task.swipe.cantMove'), tone: 'blocked' as const },
      };
    }
    const urgency = dueUrgency(task);
    return {
      left: { label: t('task.swipe.delete'), tone: 'danger' as const, onAction: () => deleteTask(task) },
      right:
        urgency === 'overdue' || urgency === 'today'
          ? undefined
          : {
              label: t('task.swipe.toBacklog'),
              tone: 'neutral' as const,
              onAction: () => updateStatus.mutateAsync({ id: task.id, status: 'backlog' }),
            },
    };
  };

  // Reflecting only happens on finished tasks; unchecking a pill clears that part of the check-in.
  const saveReflection = (task: Task, { feeling, actualMinutes }: Reflection) => {
    setReflecting(null);
    updateStatus.mutate({
      id: task.id,
      status: 'done',
      feeling: feeling ?? null,
      actualMinutes: actualMinutes ?? null,
    });
  };

  const recurringToday = useMemo(
    () => (recurringTasks ?? []).filter((task) => hasOccurrenceOn(task, today)),
    [recurringTasks, today]
  );
  const missedOccurrenceCount = useMemo(
    () =>
      (recurringTasks ?? []).filter(
        (task) => (task.missedDates ?? []).length > 0 && (!shared || inMyTriage(task, me?.userId))
      ).length,
    [recurringTasks, shared, me?.userId]
  );
  const myTriageCount = (triageTasks ?? []).filter((task) => !shared || inMyTriage(task, me?.userId)).length;
  const triageCount = myTriageCount + missedOccurrenceCount;

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

  // Mine / Everyone / Unassigned only exists on shared boards.
  const inView = (task: Task) => !shared || matchesAssigneeView(task, assigneeView, me?.userId);
  const filteredOpenTasks = useMemo(
    () => sortedOpenTasks.filter((task) => matchesFilters(task, filters) && inView(task)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedOpenTasks, filters, shared, assigneeView, me?.userId]
  );
  const filteredDoneToday = useMemo(
    () => doneToday.filter((task) => matchesFilters(task, filters) && inView(task)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doneToday, filters, shared, assigneeView, me?.userId]
  );
  const viewCount = (view: AssigneeView) =>
    sortedOpenTasks.filter((task) => matchesAssigneeView(task, view, me?.userId)).length;
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
    <div className={styles.layout}>
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
                {sortOpen && (
                  <TaskSortPopover
                    sortBy={sortBy}
                    onChange={(todaySortBy) => updatePreferences({ todaySortBy })}
                    onClose={() => setSortOpen(false)}
                  />
                )}
              </div>
              <Button variant="ghost" onClick={() => setHideDone((v) => !v)}>
                {hideDone ? t('today.showDone') : t('today.hideDone')}
              </Button>
            </>
          }
        />

        {greeting && greetingOpen && (
          <div className={styles.greeting}>
            <SamoyedAvatar moment={greeting} size={56} />
            <span className={styles.greetingText}>{t(`samoyed.phrases.${greeting}`)}</span>
            <button
              type="button"
              className={styles.greetingClose}
              aria-label={t('samoyed.dismiss')}
              onClick={() => setGreetingOpen(false)}
            >
              ×
            </button>
          </div>
        )}

        {!!triageCount && (
          <div className={styles.triageBanner}>
            <span className={styles.triageIcon} aria-hidden>
              <span className={styles.triageIconBack} />
              <span className={styles.triageIconFront} />
            </span>
            <div className={styles.triageText}>
              <span className={styles.triageTitle}>{t('today.triageBannerText', { count: triageCount })}</span>
              <span className={styles.triageSubtitle}>
                {t('today.triageBannerHint', { minutes: Math.max(1, Math.round(triageCount / 2)) })}
              </span>
            </div>
            <button type="button" className={styles.triageBannerAction} onClick={() => navigate('/triage')}>
              {t('today.startTriage')}
            </button>
          </div>
        )}

        <ReflectModal task={reflecting} done onClose={() => setReflecting(null)} onSubmit={saveReflection} />

        {shared && (
          <div className={styles.assigneeTabs}>
            <SegmentedTabs
              value={assigneeView}
              onChange={(view) => setAssigneeView(view as AssigneeView)}
              options={ASSIGNEE_VIEWS.map((view) => ({
                value: view,
                label: t(`board.filter.${view}`, { count: viewCount(view) }),
              }))}
            />
          </div>
        )}

        <AppliedFilters filters={filters} onChange={setFilters} />

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

          {sortedOpenTasks.length === 0 && doneToday.length > 0 && samoyedMode !== 'off' && (
            <div className={styles.allDone}>
              <SamoyedMoment moment="allDone" />
              <span className={styles.allDoneSummary}>{t('samoyed.allDoneSummary', { done: doneToday.length })}</span>
            </div>
          )}

          {displayedOpenTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggle(task, true)}
              onOpen={() => taskForm.openView(task)}
              swipe={swipeFor(task)}
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
                  onOpen={() => taskForm.openView(task)}
                  // ponytail: recurring occurrences have no per-occurrence feeling/time field on the BE yet.
                  onReflect={task.recurrence ? undefined : () => setReflecting(task)}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <TodayRail openTasks={sortedOpenTasks} />
    </div>
  );
}
