import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, EmptyState, PillButton, SamoyedMoment, SearchField } from '../../components/ui';
import {
  TaskRow,
  taskForm,
  leaveThen,
  AppliedFilters,
  FilterRail,
  FilterSheet,
  FiltersButton,
  activeFilterCount,
  matchesFilters,
} from '../../components/task';
import { useDeleteTaskWithUndo } from '../../hooks/useDeleteTaskWithUndo';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { usePreferences } from '../../hooks/usePreferences';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { tryAppear } from '../../lib/samoyed';
import { groupTasks, type GroupBy } from '../../lib/taskGrouping';
import { weekdayLabel } from '../../lib/dateUtils';
import type { Task } from '../../models';
import { PlannedPerWeek } from './PlannedPerWeek';
import styles from './Backlog.module.css';

/** v7 date column: day number over the short weekday; kept (invisible) for alignment on undated or repeated days. */
function DateCell({ task, repeat }: { task: Task; repeat: boolean }) {
  const { i18n } = useTranslation();
  const date = task.dueDate ? new Date(task.dueDate.slice(0, 10) + 'T00:00:00') : null;
  return (
    <span className={styles.date} style={repeat ? { visibility: 'hidden' } : undefined}>
      {date && (
        <>
          <span className={styles.dateDay}>{date.getDate()}</span>
          <span className={styles.dateWeekday}>{weekdayLabel(date, i18n.language)}</span>
        </>
      )}
    </span>
  );
}

export default function Backlog() {
  const { t } = useTranslation();
  const { data: tasks, isLoading, error } = useTasksByStatus('backlog');
  const { data: areas } = useLifeAreas();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTaskWithUndo();
  const [search, setSearch] = useState('');
  const { filters, setFilters } = useTaskFilters();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { preferences, update: updatePreferences } = usePreferences();
  // Older saved groupings (priority, energy…) fall back to Date.
  const groupBy: GroupBy = preferences.backlogGroupBy === 'area' ? 'area' : 'date';
  const setGroupBy = (backlogGroupBy: GroupBy) => updatePreferences({ backlogGroupBy });

  if (isLoading) return <PageState>{t('backlog.loading')}</PageState>;
  if (error) return <PageState>{t('backlog.error')}</PageState>;

  const allTasks = tasks ?? [];
  const query = search.trim().toLowerCase();
  const filteredTasks = allTasks.filter(
    (task) => task.title.toLowerCase().includes(query) && matchesFilters(task, filters)
  );
  const filterCount = activeFilterCount(filters);
  const groups = groupTasks(filteredTasks, groupBy, areas ?? []);
  // One date column for the whole list, so titles line up across groups; none when nothing has a date.
  const showDates = filteredTasks.some((task) => task.dueDate);

  const napping = allTasks.length === 0 && !search && !filterCount && tryAppear('emptyBacklog');
  const narrowed = !!search || filterCount > 0;
  const panelProps = {
    tasks: allTasks,
    filters,
    onChange: setFilters,
    order: {
      label: t('backlog.groupBy'),
      value: groupBy,
      options: (['date', 'area'] as const).map((value) => ({ value, label: t(`backlog.group.${value}`) })),
      onChange: setGroupBy,
    },
  };

  return (
    <div className={styles.layout}>
      <div className={styles.page}>
        <PageHeader
          title={t('backlog.title')}
          subtitle={t('backlog.subtitle', { count: allTasks.length })}
          actions={
            <>
              <SearchField value={search} onChange={setSearch} label={t('backlog.searchPlaceholder')} />
              <FiltersButton filters={filters} onClick={() => setSheetOpen(true)} />
            </>
          }
        />

        {narrowed && (
          <div className={styles.summary}>
            <AppliedFilters
              filters={filters}
              onChange={setFilters}
              summary={t('filters.shown', { shown: filteredTasks.length, count: allTasks.length })}
            />
          </div>
        )}

        <div className={styles.groups}>
          {napping && <SamoyedMoment moment="emptyBacklog" />}
          {groups.length === 0 && !napping && (
            <EmptyState
              title={t('backlog.emptyTitle')}
              description={narrowed ? t('backlog.emptyNoResults') : t('backlog.emptyDefault')}
              action={
                !narrowed && (
                  <Button variant="primary" onClick={() => taskForm.openNew()}>
                    {t('sidebar.newTask')}
                  </Button>
                )
              }
            />
          )}

          {groups.map((group) => (
            <section key={group.key} className={styles.group}>
              <h2 className={styles.groupHeader}>
                {group.dot && <span className={styles.groupDot} style={{ background: group.dot }} />}
                {group.areaName ?? t(group.labelKey!)} · {group.tasks.length}
              </h2>
              {group.tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  hideDue={showDates}
                  leading={
                    showDates && (
                      <DateCell
                        task={task}
                        repeat={
                          !!task.dueDate && task.dueDate.slice(0, 10) === group.tasks[i - 1]?.dueDate?.slice(0, 10)
                        }
                      />
                    )
                  }
                  onOpen={() => taskForm.openView(task)}
                  swipe={{
                    left: {
                      label: t('task.swipe.delete'),
                      tone: 'danger',
                      onAction: () => deleteTask(task),
                    },
                    // A recurring series is forced to the backlog by the BE, so it can't move to Today.
                    right: task.recurrence
                      ? { label: t('task.swipe.cantMove'), tone: 'blocked' }
                      : {
                          label: t('task.swipe.toToday'),
                          tone: 'neutral',
                          onAction: () => updateStatus.mutateAsync({ id: task.id, status: 'today' }),
                        },
                  }}
                  trailing={
                    <span className={styles.toToday}>
                      <PillButton
                        aria-label={t('task.addToToday')}
                        onClick={() =>
                          leaveThen(task.id, () => updateStatus.mutateAsync({ id: task.id, status: 'today' }))
                        }
                      >
                        {t('task.toToday')}
                      </PillButton>
                    </span>
                  }
                />
              ))}
            </section>
          ))}
        </div>
      </div>

      <FilterRail {...panelProps}>
        <PlannedPerWeek tasks={allTasks} />
      </FilterRail>

      <FilterSheet
        {...panelProps}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        matchCount={filteredTasks.length}
      />
    </div>
  );
}
