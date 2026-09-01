import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTasksByStatus, useRecurringTasks } from '../../../hooks/useTasks';
import { openRecurringOn } from '../../../lib/recurrence';
import { taskForm } from '../../task';
import styles from './BottomNav.module.css';

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ');
}

export function BottomNav() {
  const { t } = useTranslation();
  const { data: todayTasks } = useTasksByStatus('today');
  const { data: backlogTasks } = useTasksByStatus('backlog');
  const { data: recurringTasks } = useRecurringTasks();

  const todayCount = (todayTasks?.length ?? 0) + openRecurringOn(recurringTasks, new Date()).length;

  return (
    <nav className={styles.nav}>
      <NavLink to="/today" className={navClassName}>
        <span>{t('nav.today')}</span>
        {todayCount > 0 && <span className={styles.count}>{todayCount}</span>}
      </NavLink>
      <NavLink to="/backlog" className={navClassName}>
        <span>{t('nav.backlog')}</span>
        {backlogTasks && backlogTasks.length > 0 && <span className={styles.count}>{backlogTasks.length}</span>}
      </NavLink>
      <NavLink to="/calendar" className={navClassName}>
        <span>{t('nav.calendar')}</span>
      </NavLink>
      <button type="button" className={styles.add} aria-label={t('sidebar.newTask')} onClick={() => taskForm.openNew()}>
        +
      </button>
    </nav>
  );
}
