import { NavLink, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, ProfileAvatar, SettingsIcon } from '../../ui';
import { taskForm } from '../../task';
import { lifeAreasModal } from '../../lifeAreas';
import { BoardSwitcher, MembersSection } from '../../board';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { imageUrl } from '../../../lib/images';
import { useActiveBoard } from '../../../hooks/useBoards';
import { useTasksByStatus, useRecurringTasks } from '../../../hooks/useTasks';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { useAreaFilter } from '../../../hooks/useAreaFilter';
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
  // On Today and Backlog the area list doubles as the page's life-area filter.
  const onBacklog = useMatch('/backlog');
  const onToday = useMatch('/today');
  const filtersByArea = !!onBacklog || !!onToday;
  const areaFilter = useAreaFilter();

  const todayCount = (todayTasks?.length ?? 0) + openRecurringOn(recurringTasks, new Date()).length;

  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');
  const avatarKey = board?.members.find((m) => m.email === user?.email)?.avatarKey;
  const avatarSrc = avatarKey ? imageUrl(avatarKey) : user?.picture;

  return (
    <aside className={styles.sidebar}>
      <BoardSwitcher />

      <Button variant="primary" className={styles.newTaskButton} onClick={() => taskForm.openNew()}>
        <span aria-hidden>+</span>
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
        <NavLink to="/dashboard" className={navClassName}>
          <span>{t('nav.dashboard')}</span>
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
        {lifeAreas?.map((area) => {
          const dot = <span className={styles.areaDot} style={{ background: lifeAreaColorVar(area.order) }} />;
          return filtersByArea ? (
            <button
              key={area.id}
              type="button"
              className={`${styles.areaRow} ${styles.areaButton}`}
              aria-pressed={areaFilter.areaIds.includes(area.id)}
              onClick={() => areaFilter.toggle(area.id)}
            >
              {dot}
              {area.name}
            </button>
          ) : (
            <div key={area.id} className={styles.areaRow}>
              {dot}
              {area.name}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <NavLink to="/settings" className={styles.profile} title={t('settings.profileHint')}>
          <ProfileAvatar src={avatarSrc} name={displayName} />
          <div className={styles.profileText}>
            <span className={styles.profileName}>{displayName}</span>
            {user?.email && <span className={styles.profileSubtitle}>{user.email}</span>}
          </div>
          <span className={styles.settingsIcon} aria-hidden="true">
            <SettingsIcon size={17} />
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
