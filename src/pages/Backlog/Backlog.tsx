import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, EmptyState, Modal, PillButton, SamoyedMoment } from '../../components/ui';
import {
  TaskRow,
  taskForm,
  leaveThen,
  AppliedFilters,
  EMPTY_TASK_FILTERS,
  activeFilterCount,
  matchesFilters,
  type TaskFilters,
} from '../../components/task';
import { useDeleteTaskWithUndo } from '../../hooks/useDeleteTaskWithUndo';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { usePreferences } from '../../hooks/usePreferences';
import { useAreaFilter } from '../../hooks/useAreaFilter';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tryAppear } from '../../lib/samoyed';
import { groupTasks, type GroupBy } from '../../lib/taskGrouping';
import { weekdayLabel } from '../../lib/dateUtils';
import type { Task } from '../../models';
import { BacklogFilters, ClearAll, PlannedPerWeek } from './BacklogFilters';
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
  const searchRef = useRef<HTMLInputElement>(null);
  // Priority and energy live here; life areas live in the URL so the sidebar can toggle them.
  const [metaFilters, setMetaFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const { areaIds, setAreaIds } = useAreaFilter();
  const filters: TaskFilters = { ...metaFilters, areaIds };
  const setFilters = (next: TaskFilters) => {
    setMetaFilters({ ...next, areaIds: [] });
    setAreaIds(next.areaIds);
  };
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { preferences, update: updatePreferences } = usePreferences();
  // Older saved groupings (priority, energy…) fall back to Date.
  const groupBy: GroupBy = preferences.backlogGroupBy === 'area' ? 'area' : 'date';
  const setGroupBy = (backlogGroupBy: GroupBy) => updatePreferences({ backlogGroupBy });

  // "/" jumps to search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
  const filtersLabel = filterCount ? t('backlog.filtersActive', { count: filterCount }) : t('backlog.filters');

  const panelProps = { tasks: allTasks, filters, onChange: setFilters, groupBy, onGroupBy: setGroupBy };

  return (
    <div className={styles.layout}>
      <div className={styles.page}>
        <PageHeader
          title={t('backlog.title')}
          subtitle={t('backlog.subtitle', { count: allTasks.length })}
          actions={
            <>
              <label className={styles.search}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  type="search"
                  className={styles.searchInput}
                  aria-label={t('backlog.searchPlaceholder')}
                  placeholder={t('backlog.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd className={styles.searchKey}>/</kbd>
              </label>
              <button
                type="button"
                className={styles.filtersButton}
                aria-label={filtersLabel}
                aria-pressed={filterCount > 0}
                onClick={() => setSheetOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {t('backlog.filters')}
                {filterCount > 0 && <span className={styles.filtersCount}>{filterCount}</span>}
              </button>
            </>
          }
        />

        {narrowed && (
          <div className={styles.summary}>
            <AppliedFilters
              filters={filters}
              onChange={setFilters}
              summary={t('backlog.shown', { shown: filteredTasks.length, count: allTasks.length })}
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
                  // Phones move a task to Today by swiping right; the button would squeeze the title.
                  trailing={
                    !isMobile && (
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
                    )
                  }
                />
              ))}
            </section>
          ))}
        </div>
      </div>

      <aside className={styles.rail}>
        <div className={styles.railFilters}>
          <BacklogFilters {...panelProps} inRail />
        </div>
        <PlannedPerWeek tasks={allTasks} />
      </aside>

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('backlog.filters')}>
        <BacklogFilters {...panelProps} />
        <div className={styles.sheetFooter}>
          <ClearAll onClear={() => setFilters(EMPTY_TASK_FILTERS)} />
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            {t('today.showTasks', { count: filteredTasks.length })}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
