import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button } from '../../components/ui';
import { TaskRow, DoneTaskRow, taskForm } from '../../components/task';
import { useTasksByStatus, useUpdateTaskStatus } from '../../hooks/useTasks';
import { PRIORITY_RANK } from '../../lib/priority';
import { isSameDay } from '../../lib/dateUtils';
import styles from './Today.module.css';

export default function Today() {
  const { t, i18n } = useTranslation();
  const { data: openTasks, isLoading, error } = useTasksByStatus('today');
  const { data: doneTasks } = useTasksByStatus('done');
  const updateStatus = useUpdateTaskStatus();

  const [hideDone, setHideDone] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(true);

  const doneToday = useMemo(() => {
    const today = new Date();
    return (doneTasks ?? []).filter((task) => task.completedAt && isSameDay(new Date(task.completedAt), today));
  }, [doneTasks]);

  const sortedOpenTasks = useMemo(() => {
    const tasks = [...(openTasks ?? [])];
    if (sortByPriority) {
      tasks.sort(
        (a, b) => (a.priority ? PRIORITY_RANK[a.priority] : 99) - (b.priority ? PRIORITY_RANK[b.priority] : 99)
      );
    }
    return tasks;
  }, [openTasks, sortByPriority]);

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

      <div className={styles.list}>
        {sortedOpenTasks.length === 0 && doneToday.length === 0 && <p className={styles.empty}>{t('today.empty')}</p>}

        {sortedOpenTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => updateStatus.mutate({ id: task.id, status: 'done' })}
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
                onToggle={() => updateStatus.mutate({ id: task.id, status: 'today' })}
              />
            ))}
          </>
        )}

        <div className={styles.pullPlaceholder}>{t('today.pullPlaceholder')}</div>
      </div>
    </div>
  );
}
