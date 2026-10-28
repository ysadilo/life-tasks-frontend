import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, EmptyState, PillButton, SamoyedMoment, ToolbarPill } from '../../components/ui';
import {
  TaskRow,
  taskForm,
  leaveThen,
  AppliedFilters,
  TaskGroupPopover,
  TaskFilterPopover,
  EMPTY_TASK_FILTERS,
  activeFilterCount,
  matchesFilters,
  type TaskFilters,
} from '../../components/task';
import { useDeleteTaskWithUndo } from '../../hooks/useDeleteTaskWithUndo';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { usePreferences } from '../../hooks/usePreferences';
import { tryAppear } from '../../lib/samoyed';
import { groupTasks } from '../../lib/taskGrouping';
import styles from './Backlog.module.css';

export default function Backlog() {
  const { t } = useTranslation();
  const { data: tasks, isLoading, error } = useTasksByStatus('backlog');
  const { data: areas } = useLifeAreas();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTaskWithUndo();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const { preferences, update: updatePreferences } = usePreferences();
  const groupBy = preferences.backlogGroupBy;
  const [groupOpen, setGroupOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const toggleGroup = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (tasks ?? []).filter((task) => task.title.toLowerCase().includes(query) && matchesFilters(task, filters));
  }, [tasks, search, filters]);
  const filterCount = activeFilterCount(filters);

  const groups = useMemo(() => groupTasks(filteredTasks, groupBy, areas ?? []), [filteredTasks, groupBy, areas]);

  if (isLoading) return <PageState>{t('backlog.loading')}</PageState>;
  if (error) return <PageState>{t('backlog.error')}</PageState>;

  const napping = tasks?.length === 0 && !search && !filterCount && tryAppear('emptyBacklog');

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('backlog.title')}
        subtitle={t('backlog.subtitle', {
          count: filteredTasks.length,
          grouping: t(`backlog.group.subtitle.${groupBy}`),
        })}
      />

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.6" />
            <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder={t('backlog.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className={styles.filterWrap}>
          <ToolbarPill caret onClick={() => setGroupOpen((v) => !v)}>
            {t('backlog.group.label', { mode: t(`backlog.group.${groupBy}`) })}
          </ToolbarPill>
          {groupOpen && (
            <TaskGroupPopover
              groupBy={groupBy}
              onChange={(backlogGroupBy) => updatePreferences({ backlogGroupBy })}
              onClose={() => setGroupOpen(false)}
            />
          )}
        </div>
        <div className={styles.filterWrap}>
          <ToolbarPill active={filterCount > 0} onClick={() => setFilterOpen((v) => !v)}>
            {filterCount > 0 ? `${t('today.filter')} · ${filterCount}` : t('today.filter')}
          </ToolbarPill>
          {filterOpen && (
            <TaskFilterPopover
              filters={filters}
              onChange={setFilters}
              matchCount={filteredTasks.length}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>
      </div>

      <AppliedFilters filters={filters} onChange={setFilters} />

      <div className={styles.groups}>
        {napping && <SamoyedMoment moment="emptyBacklog" />}
        {groups.length === 0 && !napping && (
          <EmptyState
            title={t('backlog.emptyTitle')}
            description={search || filterCount ? t('backlog.emptyNoResults') : t('backlog.emptyDefault')}
            action={
              !search &&
              !filterCount && (
                <Button variant="primary" onClick={() => taskForm.openNew()}>
                  {t('sidebar.newTask')}
                </Button>
              )
            }
          />
        )}

        {groups.map((group) => {
          const hasHeader = group.labelKey !== null || group.areaName;
          const isCollapsed = !!hasHeader && collapsed.has(group.key);
          return (
            <div key={group.key} className={styles.group}>
              {hasHeader ? (
                <button
                  type="button"
                  className={styles.groupHeader}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleGroup(group.key)}
                >
                  <span className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ''}`} aria-hidden />
                  {group.dot && <span className={styles.groupDot} style={{ background: group.dot }} />}
                  <span className={styles.groupLabel}>{group.areaName ?? t(group.labelKey!, group.labelValues)}</span>
                  <span className={styles.groupCount}>{group.tasks.length}</span>
                </button>
              ) : null}
              {!isCollapsed &&
                group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    inline
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
                      <PillButton
                        aria-label={t('task.addToToday')}
                        onClick={() =>
                          leaveThen(task.id, () => updateStatus.mutateAsync({ id: task.id, status: 'today' }))
                        }
                      >
                        {t('task.toToday')}
                      </PillButton>
                    }
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
