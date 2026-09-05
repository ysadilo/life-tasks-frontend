import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { useTasksByStatus, useRecurringTasks } from '../../../hooks/useTasks';
import { openRecurringOn } from '../../../lib/recurrence';
import { useTheme } from '../../../theme/ThemeProvider';
import { taskForm } from '../../task';
import { lifeAreasModal } from '../../lifeAreas';
import styles from './BottomNav.module.css';

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ');
}

export function BottomNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth0();
  const { theme, toggleTheme } = useTheme();
  const { data: todayTasks } = useTasksByStatus('today');
  const { data: backlogTasks } = useTasksByStatus('backlog');
  const { data: recurringTasks } = useRecurringTasks();
  const [menuOpen, setMenuOpen] = useState(false);

  const todayCount = (todayTasks?.length ?? 0) + openRecurringOn(recurringTasks, new Date()).length;
  const isGlamour = theme === 'glamour';
  const displayName = user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName');

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

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
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.add}
          aria-label={t('sidebar.newTask')}
          onClick={() => taskForm.openNew()}
        >
          +
        </button>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <div className={styles.menu} role="menu">
            <div className={styles.menuProfile}>
              {user?.picture ? (
                <img className={styles.avatar} src={user.picture} alt="" />
              ) : (
                <div className={styles.avatar} />
              )}
              <div className={styles.profileText}>
                <span className={styles.profileName}>{displayName}</span>
                <span className={styles.profileSubtitle}>{t('sidebar.soloBoard')}</span>
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
            >
              <span className={styles.menuIcon}>{isGlamour ? '✦' : '☾'}</span>
              {t('sidebar.switchThemeShort')}
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                lifeAreasModal.openManage();
                setMenuOpen(false);
              }}
            >
              <span className={styles.menuIcon}>◧</span>
              {t('sidebar.manageLifeAreas')}
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              <span className={styles.menuIcon}>⇥</span>
              {t('auth.signOut')}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
