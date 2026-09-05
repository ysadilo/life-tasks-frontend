import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, ThemeToggle } from '../../ui';
import { taskForm } from '../../task';
import { LIFE_AREAS, lifeAreaColorVar } from '../../../lib/lifeAreas';
import { useTasksByStatus, useRecurringTasks } from '../../../hooks/useTasks';
import { openRecurringOn } from '../../../lib/recurrence';
import styles from './Sidebar.module.css';

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ');
}

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth0();
  const { data: todayTasks } = useTasksByStatus('today');
  const { data: backlogTasks } = useTasksByStatus('backlog');
  const { data: recurringTasks } = useRecurringTasks();

  const todayCount = (todayTasks?.length ?? 0) + openRecurringOn(recurringTasks, new Date()).length;

  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark} />
        <span className={styles.logoText}>{t('app.name')}</span>
      </div>

      <Button variant="primary" className={styles.newTaskButton} onClick={() => taskForm.openNew()}>
        {t('sidebar.newTask')}
      </Button>

      <nav className={styles.nav}>
        <NavLink to="/today" className={navClassName}>
          <span>{t('nav.today')}</span>
          {todayTasks && <span className={styles.count}>{todayCount}</span>}
        </NavLink>
        <NavLink to="/backlog" className={navClassName}>
          <span>{t('nav.backlog')}</span>
          {backlogTasks && <span className={styles.count}>{backlogTasks.length}</span>}
        </NavLink>
        <NavLink to="/calendar" className={navClassName}>
          <span>{t('nav.calendar')}</span>
        </NavLink>
      </nav>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('sidebar.lifeAreas')}</span>
        {LIFE_AREAS.map((area) => (
          <div key={area.id} className={styles.areaRow}>
            <span className={styles.areaDot} style={{ background: lifeAreaColorVar(area.id) }} />
            {t(`lifeArea.${area.id}`)}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <ThemeToggle />
        <button
          type="button"
          className={styles.profile}
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          title={t('auth.signOut')}
        >
          {user?.picture ? (
            <img className={styles.avatar} src={user.picture} alt="" />
          ) : (
            <div className={styles.avatar} />
          )}
          <div className={styles.profileText}>
            <span className={styles.profileName}>{displayName}</span>
            <span className={styles.profileSubtitle}>{t('sidebar.soloBoard')}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
