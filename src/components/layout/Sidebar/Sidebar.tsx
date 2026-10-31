import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, SettingsIcon } from '../../ui';
import { taskForm } from '../../task';
import { lifeAreasModal } from '../../lifeAreas';
import { BoardSwitcher, MembersSection } from '../../board';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { imageUrl } from '../../../lib/images';
import { useActiveBoard } from '../../../hooks/useBoards';
import { useTasksByStatus, useRecurringTasks } from '../../../hooks/useTasks';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { openRecurringOn } from '../../../lib/recurrence';
import styles from './Sidebar.module.css';

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ');
}

export function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth0();
  const { data: todayTasks } = useTasksByStatus('today');
  const { data: backlogTasks } = useTasksByStatus('backlog');
  const { data: recurringTasks } = useRecurringTasks();
  const { data: lifeAreas } = useLifeAreas();
  const board = useActiveBoard();

  const todayCount = (todayTasks?.length ?? 0) + openRecurringOn(recurringTasks, new Date()).length;

  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');
  const avatarKey = board?.members.find((m) => m.email === user?.email)?.avatarKey;
  const avatarSrc = avatarKey ? imageUrl(avatarKey) : user?.picture;

  return (
    <aside className={styles.sidebar}>
      <BoardSwitcher />

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

      <MembersSection />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>{t('sidebar.lifeAreas')}</span>
          <button type="button" className={styles.manageLink} onClick={() => lifeAreasModal.openManage()}>
            {t('sidebar.manage')}
          </button>
        </div>
        {lifeAreas?.map((area) => (
          <div key={area.id} className={styles.areaRow}>
            <span className={styles.areaDot} style={{ background: lifeAreaColorVar(area.order) }} />
            {area.name}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <NavLink to="/settings" className={styles.profile}>
          {avatarSrc ? (
            <img className={styles.avatar} src={avatarSrc} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className={styles.avatar}>{displayName[0]?.toUpperCase()}</div>
          )}
          <div className={styles.profileText}>
            <span className={styles.profileName}>{displayName}</span>
            <span className={styles.profileSubtitle}>{t('settings.profileHint')}</span>
          </div>
          <span className={styles.settingsIcon} aria-label={t('nav.settings')}>
            <SettingsIcon />
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
