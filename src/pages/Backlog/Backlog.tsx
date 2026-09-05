import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, Input, EmptyState } from '../../components/ui';
import { TaskRow, taskForm } from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../lib/lifeAreas';
import type { LifeArea, Task } from '../../models';
import styles from './Backlog.module.css';

interface Group {
  area: LifeArea | null;
  tasks: Task[];
}

function groupByArea(tasks: Task[], areas: LifeArea[]): Group[] {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.areaId ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  const ordered: Group[] = [];
  for (const area of areas) {
    const areaTasks = groups.get(area.id);
    if (areaTasks?.length) ordered.push({ area, tasks: areaTasks });
  }
  const other = groups.get('other');
  if (other?.length) ordered.push({ area: null, tasks: other });

  return ordered;
}

export default function Backlog() {
  const { t } = useTranslation();
  const { data: tasks, isLoading, error } = useTasksByStatus('backlog');
  const { data: areas } = useLifeAreas();
  const updateStatus = useUpdateTaskStatus();
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks ?? [];
    return (tasks ?? []).filter((task) => task.title.toLowerCase().includes(query));
  }, [tasks, search]);

  const groups = useMemo(() => groupByArea(filteredTasks, areas ?? []), [filteredTasks, areas]);

  if (isLoading) return <PageState>{t('backlog.loading')}</PageState>;
  if (error) return <PageState>{t('backlog.error')}</PageState>;

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('backlog.title')}
        subtitle={t('backlog.subtitle', { count: filteredTasks.length })}
        actions={
          <>
            <Input
              placeholder={t('backlog.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="ghost">{t('backlog.groupByArea')}</Button>
          </>
        }
      />

      <div className={styles.groups}>
        {groups.length === 0 && (
          <EmptyState
            title={t('backlog.emptyTitle')}
            description={search ? t('backlog.emptyNoResults') : t('backlog.emptyDefault')}
            action={
              !search && (
                <Button variant="primary" onClick={() => taskForm.openNew()}>
                  {t('sidebar.newTask')}
                </Button>
              )
            }
          />
        )}

        {groups.map((group) => (
          <div key={group.area?.id ?? 'other'} className={styles.group}>
            <div className={styles.groupHeader}>
              {group.area && (
                <span className={styles.groupDot} style={{ background: lifeAreaColorVar(group.area.order) }} />
              )}
              <span className={styles.groupLabel}>{group.area ? group.area.name : t('backlog.otherGroup')}</span>
              <span className={styles.groupCount}>{group.tasks.length}</span>
            </div>
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={() => taskForm.openEdit(task)}
                trailing={
                  <Button variant="secondary" onClick={() => updateStatus.mutate({ id: task.id, status: 'today' })}>
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
