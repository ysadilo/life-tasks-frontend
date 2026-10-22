import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, Input, EmptyState } from '../../components/ui';
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
import { useDeleteTask, useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { usePreferences } from '../../hooks/usePreferences';
import { groupTasks } from '../../lib/taskGrouping';
import styles from './Backlog.module.css';

export default function Backlog() {
  const { t } = useTranslation();
  const { data: tasks, isLoading, error } = useTasksByStatus('backlog');
  const { data: areas } = useLifeAreas();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const { preferences, update: updatePreferences } = usePreferences();
  const groupBy = preferences.backlogGroupBy;
  const [groupOpen, setGroupOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (tasks ?? []).filter((task) => task.title.toLowerCase().includes(query) && matchesFilters(task, filters));
  }, [tasks, search, filters]);
  const filterCount = activeFilterCount(filters);

  const groups = useMemo(() => groupTasks(filteredTasks, groupBy, areas ?? []), [filteredTasks, groupBy, areas]);

  if (isLoading) return <PageState>{t('backlog.loading')}</PageState>;
  if (error) return <PageState>{t('backlog.error')}</PageState>;

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('backlog.title')}
        subtitle={t('backlog.subtitle', {
          count: filteredTasks.length,
          grouping: t(`backlog.group.subtitle.${groupBy}`),
        })}
        actions={
          <>
            <Input
              placeholder={t('backlog.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className={styles.filterWrap}>
              <Button variant="ghost" onClick={() => setGroupOpen((v) => !v)}>
                {t('backlog.group.label', { mode: t(`backlog.group.${groupBy}`) })}
              </Button>
              {groupOpen && (
                <TaskGroupPopover
                  groupBy={groupBy}
                  onChange={(backlogGroupBy) => updatePreferences({ backlogGroupBy })}
                  onClose={() => setGroupOpen(false)}
                />
              )}
            </div>
            <div className={styles.filterWrap}>
              <Button variant="ghost" onClick={() => setFilterOpen((v) => !v)}>
                {filterCount > 0 ? `${t('today.filter')} · ${filterCount}` : t('today.filter')}
              </Button>
              {filterOpen && (
                <TaskFilterPopover
                  filters={filters}
                  onChange={setFilters}
                  matchCount={filteredTasks.length}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </div>
          </>
        }
      />

      <AppliedFilters filters={filters} onChange={setFilters} />

      <div className={styles.groups}>
        {groups.length === 0 && (
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

        {groups.map((group) => (
          <div key={group.key} className={styles.group}>
            {group.labelKey !== null || group.areaName ? (
              <div className={styles.groupHeader}>
                {group.dot && <span className={styles.groupDot} style={{ background: group.dot }} />}
                <span className={styles.groupLabel}>{group.areaName ?? t(group.labelKey!, group.labelValues)}</span>
                <span className={styles.groupCount}>{group.tasks.length}</span>
              </div>
            ) : null}
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={() => taskForm.openEdit(task)}
                swipe={{
                  left: {
                    label: t('task.swipe.delete'),
                    tone: 'danger',
                    onAction: () => deleteTask.mutateAsync(task.id),
                  },
                  // A recurring series is forced to the backlog by the BE, so it can't move to Today.
                  right: task.recurrence
                    ? undefined
                    : {
                        label: t('task.swipe.toToday'),
                        tone: 'neutral',
                        onAction: () => updateStatus.mutateAsync({ id: task.id, status: 'today' }),
                      },
                }}
                trailing={
                  <Button
                    variant="secondary"
                    onClick={() => leaveThen(task.id, () => updateStatus.mutateAsync({ id: task.id, status: 'today' }))}
                  >
                    {t('task.addToToday')}
                  </Button>
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
