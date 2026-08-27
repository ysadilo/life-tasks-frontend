import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, ThemeToggle } from '../../ui';
import { LIFE_AREAS, lifeAreaColorVar } from '../../../lib/lifeAreas';
import { useTasksByStatus } from '../../../hooks/useTasks';
import styles from './Sidebar.module.css';

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ');
}

export function Sidebar() {
  const { t } = useTranslation();
  const { data: todayTasks } = useTasksByStatus('today');
  const { data: backlogTasks } = useTasksByStatus('backlog');

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark} />
        <span className={styles.logoText}>{t('app.name')}</span>
      </div>

      <Button variant="primary" className={styles.newTaskButton}>
        {t('sidebar.newTask')}
      </Button>

      <nav className={styles.nav}>
        <NavLink to="/today" className={navClassName}>
          <span>{t('nav.today')}</span>
          {todayTasks && <span className={styles.count}>{todayTasks.length}</span>}
        </NavLink>
        <NavLink to="/backlog" className={navClassName}>
          <span>{t('nav.backlog')}</span>
          {backlogTasks && <span className={styles.count}>{backlogTasks.length}</span>}
        </NavLink>
        <NavLink to="/calendar/week" className={navClassName}>
          <span>{t('nav.week')}</span>
        </NavLink>
        <NavLink to="/calendar/month" className={navClassName}>
          <span>{t('nav.month')}</span>
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
        <div className={styles.profile}>
          <div className={styles.avatar} />
          <div className={styles.profileText}>
            <span className={styles.profileName}>{t('user.defaultName')}</span>
            <span className={styles.profileSubtitle}>{t('sidebar.soloBoard')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
