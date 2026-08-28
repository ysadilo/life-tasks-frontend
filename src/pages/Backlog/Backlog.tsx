import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, Input, EmptyState } from '../../components/ui';
import { TaskRow, taskForm } from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { LIFE_AREAS, lifeAreaColorVar } from '../../lib/lifeAreas';
import type { LifeAreaId, Task } from '../../models';
import styles from './Backlog.module.css';

const AREA_ORDER: LifeAreaId[] = LIFE_AREAS.map((area) => area.id);

function groupByArea(tasks: Task[]): { id: LifeAreaId | 'other'; tasks: Task[] }[] {
  const groups = new Map<LifeAreaId | 'other', Task[]>();
  for (const task of tasks) {
    const key = task.area ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  const ordered: { id: LifeAreaId | 'other'; tasks: Task[] }[] = [];
  for (const areaId of AREA_ORDER) {
    const areaTasks = groups.get(areaId);
    if (areaTasks?.length) ordered.push({ id: areaId, tasks: areaTasks });
  }
  const other = groups.get('other');
  if (other?.length) ordered.push({ id: 'other', tasks: other });

  return ordered;
}

export default function Backlog() {
  const { t } = useTranslation();
  const { data: tasks, isLoading, error } = useTasksByStatus('backlog');
  const updateStatus = useUpdateTaskStatus();
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks ?? [];
    return (tasks ?? []).filter((task) => task.title.toLowerCase().includes(query));
  }, [tasks, search]);

  const groups = useMemo(() => groupByArea(filteredTasks), [filteredTasks]);

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
          />
        )}

        {groups.map((group) => (
          <div key={group.id} className={styles.group}>
            <div className={styles.groupHeader}>
              {group.id !== 'other' && (
                <span className={styles.groupDot} style={{ background: lifeAreaColorVar(group.id) }} />
              )}
              <span className={styles.groupLabel}>
                {group.id === 'other' ? t('backlog.otherGroup') : t(`lifeArea.${group.id}`)}
              </span>
              <span className={styles.groupCount}>{group.tasks.length}</span>
            </div>
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={() => taskForm.openEdit(task)}
                trailing={
                  <Button variant="ghost" onClick={() => updateStatus.mutate({ id: task.id, status: 'today' })}>
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
