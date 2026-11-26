import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageState } from '../../components/layout';
import { useBoardMembers } from '../../hooks/useBoards';
import { TodayRail, TodaySplit } from '../../components/board';
import {
  Button,
  EmptyState,
  peek,
  SamoyedAvatar,
  SamoyedMoment,
  SamoyedNudge,
  SearchField,
  SectionLabel,
  SegmentedTabs,
  usePhrase,
} from '../../components/ui';
import {
  TaskRow,
  DoneTaskRow,
  ReflectModal,
  type Reflection,
  taskForm,
  AppliedFilters,
  FilterRail,
  FilterSheet,
  FiltersButton,
  activeFilterCount,
  matchesFilters,
} from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus, useRecurringTasks, useToggleOccurrence } from '../../hooks/useTasks';
import { useDeleteTaskWithUndo } from '../../hooks/useDeleteTaskWithUndo';
import { usePreferences } from '../../hooks/usePreferences';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useManualOrder } from '../../hooks/useManualOrder';
import { useDragReorder } from '../../hooks/useDragReorder';
import { hasOccurrenceOn, isOccurrenceDone, occurrenceISO } from '../../lib/recurrence';
import { isSameDay } from '../../lib/dateUtils';
import { dueUrgency } from '../../lib/taskDates';
import { inMyTriage } from '../../lib/triageScope';
import { ASSIGNEE_VIEWS, canActOn, matchesAssigneeView, type AssigneeView } from '../../lib/assigneeView';
import { getSamoyedMode, isHeavyDay, tryAppear, welcomeBack, type MomentId } from '../../lib/samoyed';
import { PRIORITY_RANK } from '../../lib/priority';
import { formatMinutes } from '../../lib/taskMeta';
import { SORT_OPTIONS, sortTasks, toSortBy, type SortBy } from '../../lib/taskSort';
import type { Task } from '../../models';
import { TodayInsights } from './TodayInsights';
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

  const { shared, me, members } = useBoardMembers();
  const [assigneeView, setAssigneeView] = useState<AssigneeView>('everyone');
  const { data: areas } = useLifeAreas();
  const { preferences, update: updatePreferences } = usePreferences();
  const sortBy = toSortBy(preferences.todaySortBy);
  const { filters, setFilters } = useTaskFilters();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();
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
    if (feeling === 'drained' && tryAppear('roughCheckin')) peek.show('roughCheckin');
    if (task.recurrence) {
      toggleOccurrence.mutate({
        id: task.id,
        date: occurrenceISO(today),
        done: true,
        feeling: feeling ?? null,
        actualMinutes: actualMinutes ?? null,
      });
      return;
    }
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
  const greetingPhrase = usePhrase(greeting ?? 'welcomeBack', undefined, triageCount > 0);

  const sortedOpenTasks = useMemo(() => {
    const tasks = [...(openTasks ?? []), ...recurringToday.filter((task) => !isOccurrenceDone(task, today))];
    return sortBy === 'manual' ? manualOrder.applyOrder(tasks) : sortTasks(tasks, sortBy, areas);
  }, [openTasks, recurringToday, today, sortBy, areas, manualOrder.applyOrder]);

  const doneToday = useMemo(() => {
    const oneOff = (doneTasks ?? []).filter((task) => task.completedAt && isSameDay(new Date(task.completedAt), today));
    const recurring = recurringToday.filter((task) => isOccurrenceDone(task, today));
    return [...oneOff, ...recurring];
  }, [doneTasks, recurringToday, today]);

  // Mine / Everyone / Unassigned only exists on shared boards.
  const query = search.trim().toLowerCase();
  const shown = (task: Task) =>
    task.title.toLowerCase().includes(query) &&
    matchesFilters(task, filters) &&
    (!shared || matchesAssigneeView(task, assigneeView, me?.userId));
  const filteredOpenTasks = useMemo(
    () => sortedOpenTasks.filter(shown),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedOpenTasks, query, filters, shared, assigneeView, me?.userId]
  );
  const filteredDoneToday = useMemo(
    () => doneToday.filter(shown),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doneToday, query, filters, shared, assigneeView, me?.userId]
  );
  const filterCount = activeFilterCount(filters);

  // The dog offers to move the least pressing one-off task out of a day that's an hour+ over the usual.
  const heavyDayTask = useMemo(() => {
    if (!openTasks || !doneTasks) return null;
    const planned = [...sortedOpenTasks, ...doneToday].reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);
    if (!isHeavyDay(planned) || !tryAppear('heavyDay')) return null;
    const rank = (task: Task) => (task.priority ? PRIORITY_RANK[task.priority] : PRIORITY_RANK.P4 + 1);
    const movable = sortedOpenTasks.filter((task) => !task.recurrence && !dueUrgency(task));
    return movable.sort((a, b) => rank(b) - rank(a) || (b.dueDate ?? '9').localeCompare(a.dueDate ?? '9'))[0] ?? null;
  }, [openTasks, doneTasks, sortedOpenTasks, doneToday]);
  const [heavyDismissed, setHeavyDismissed] = useState(false);

  const openTaskIds = useMemo(() => filteredOpenTasks.map((task) => task.id), [filteredOpenTasks]);
  const dragReorder = useDragReorder(openTaskIds, manualOrder.reorder);
  const displayedOpenTasks = useMemo(() => {
    if (sortBy !== 'manual') return filteredOpenTasks;
    const byId = new Map(filteredOpenTasks.map((task) => [task.id, task]));
    return dragReorder.order.map((id) => byId.get(id)).filter((task): task is Task => !!task);
  }, [sortBy, filteredOpenTasks, dragReorder.order]);

  if (isLoading) return <PageState>{t('today.loading')}</PageState>;
  if (error) return <PageState>{t('today.error')}</PageState>;

  const dayTasks = [...sortedOpenTasks, ...doneToday];
  const openMinutes = sortedOpenTasks.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);
  // Shared boards say how many people share the day; personal ones how long it is.
  const summary = shared
    ? t('today.summaryShared', { count: sortedOpenTasks.length, people: members.length })
    : [
        t('today.summary', { count: sortedOpenTasks.length }),
        openMinutes > 0 && t('today.summaryTime', { time: formatMinutes(openMinutes) }),
      ]
        .filter(Boolean)
        .join(' · ');
  const narrowed = !!query || filterCount > 0;
  const panelProps = {
    tasks: dayTasks,
    filters,
    onChange: setFilters,
    order: {
      label: t('today.sort.by'),
      value: sortBy,
      options: SORT_OPTIONS.map((value) => ({ value, label: t(`today.sort.${value}`) })),
      onChange: (todaySortBy: SortBy) => updatePreferences({ todaySortBy }),
    },
  };

  return (
    <div className={styles.layout}>
      <div className={styles.page}>
        {/* v7: the date is the title on desktop; phones keep "Today" with the date above it. */}
        <PageHeader
          eyebrow={isMobile ? `${dateLabel(today, i18n.language, 'short')} · ${summary}` : undefined}
          title={isMobile ? t('today.title') : dateLabel(today, i18n.language, 'long')}
          subtitle={isMobile ? undefined : summary}
          actions={
            <>
              <SearchField value={search} onChange={setSearch} label={t('today.searchPlaceholder')} />
              <FiltersButton filters={filters} onClick={() => setSheetOpen(true)} />
            </>
          }
        />

        {shared && (
          <div className={styles.assigneeTabs}>
            <SegmentedTabs
              variant="plain"
              value={assigneeView}
              onChange={(view) => setAssigneeView(view as AssigneeView)}
              options={ASSIGNEE_VIEWS.map((view) => ({
                value: view,
                label: `${t(`board.filter.${view}`)} · ${
                  sortedOpenTasks.filter((task) => matchesAssigneeView(task, view, me?.userId)).length
                }`,
              }))}
            />
          </div>
        )}

        {greeting && greetingOpen && (
          <div className={styles.greeting}>
            <SamoyedAvatar moment={greeting} size={96} />
            <span className={styles.greetingText}>{greetingPhrase}</span>
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

        {heavyDayTask && !heavyDismissed && (
          <div className={styles.nudgeWrap}>
            <SamoyedNudge
              moment="heavyDay"
              actions={
                <>
                  <Button
                    variant="primary"
                    onClick={() => updateStatus.mutate({ id: heavyDayTask.id, status: 'backlog' })}
                  >
                    {t('samoyed.heavyAction', { title: heavyDayTask.title })}
                  </Button>
                  <Button variant="ghost" onClick={() => setHeavyDismissed(true)}>
                    {t('samoyed.notNow')}
                  </Button>
                </>
              }
            />
          </div>
        )}

        {!!triageCount && (
          <div className={styles.triageStrip}>
            <span className={styles.triageText}>
              <b>{t('today.triageCount', { count: triageCount })}</b>{' '}
              {isMobile ? t('today.triageWaitingShort') : t('today.triageWaiting')}
            </span>
            <Button variant="primary" onClick={() => navigate('/triage')}>
              {t('today.triageAction')}
            </Button>
          </div>
        )}

        <ReflectModal
          task={reflecting && withTodaysCheckin(reflecting, today)}
          done
          onClose={() => setReflecting(null)}
          onSubmit={saveReflection}
        />

        <TodaySplit openTasks={sortedOpenTasks} />

        {narrowed && (
          <div className={styles.summary}>
            <AppliedFilters
              filters={filters}
              onChange={setFilters}
              summary={t('filters.shown', {
                shown: filteredOpenTasks.length + filteredDoneToday.length,
                count: dayTasks.length,
              })}
            />
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

          {sortedOpenTasks.length === 0 && doneToday.length > 0 && samoyedMode !== 'off' && (
            <div className={styles.allDone}>
              <SamoyedMoment moment="allDone" />
              <span className={styles.allDoneSummary}>{t('samoyed.allDoneSummary', { done: doneToday.length })}</span>
            </div>
          )}

          {displayedOpenTasks.length > 0 && <SectionLabel>{t('today.upNext')}</SectionLabel>}
          {displayedOpenTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={canActOn(task, shared, me?.userId) ? () => toggle(task, true) : undefined}
              toggleDisabled
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

          {filteredDoneToday.length > 0 && (
            <>
              <div className={styles.doneLabel}>
                <SectionLabel>
                  {t('today.doneToday')} · {filteredDoneToday.length}
                </SectionLabel>
              </div>
              {filteredDoneToday.map((task) => (
                <DoneTaskRow
                  key={task.id}
                  task={task}
                  onToggle={canActOn(task, shared, me?.userId) ? () => toggle(task, false) : undefined}
                  onOpen={() => taskForm.openView(task)}
                  onReflect={canActOn(task, shared, me?.userId) ? () => setReflecting(task) : undefined}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <FilterRail {...panelProps}>
        {shared ? <TodayRail openTasks={sortedOpenTasks} /> : <TodayInsights dayTasks={dayTasks} today={today} />}
      </FilterRail>

      <FilterSheet
        {...panelProps}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        matchCount={filteredOpenTasks.length + filteredDoneToday.length}
      />
    </div>
  );
}

function dateLabel(day: Date, locale: string, weekday: 'long' | 'short'): string {
  return day.toLocaleDateString(locale, { weekday, day: 'numeric', month: 'long' });
}

/** A recurring series carries one check-in per day; show today's in the shape the modal reads. */
function withTodaysCheckin(task: Task, day: Date): Task {
  if (!task.recurrence) return task;
  const checkin = task.occurrenceCheckins?.[occurrenceISO(day)];
  return { ...task, feeling: checkin?.feeling ?? null, actualMinutes: checkin?.actualMinutes ?? null };
}
