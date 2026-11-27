import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskForm } from '../../task';
import styles from './BottomNav.module.css';

const svg = (children: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    {children}
  </svg>
);

/** v7 tab icons, 20px with a 1.6 stroke. */
const icons = {
  today: svg(
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M6.8 10.2l2.2 2.1 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  backlog: svg(
    <>
      <path
        d="M3 11.5l1.8-6.2A1.5 1.5 0 0 1 6.2 4.2h7.6a1.5 1.5 0 0 1 1.4 1.1l1.8 6.2V15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15v-3.5Z"
        strokeLinejoin="round"
      />
      <path d="M3 11.5h4l1 2h4l1-2h4" strokeLinejoin="round" />
    </>
  ),
  calendar: svg(
    <>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 2.8v3M13 2.8v3" strokeLinecap="round" />
    </>
  ),
  dashboard: svg(<path d="M4 16V10M8.7 16V5M13.3 16v-8M18 16H2" strokeLinecap="round" />),
};

const tabs = [
  { to: '/today', key: 'today' },
  { to: '/backlog', key: 'backlog' },
  { to: '/calendar', key: 'calendar' },
  { to: '/dashboard', key: 'dashboard' },
] as const;

function navClassName({ isActive }: { isActive: boolean }) {
  return [styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ');
}

function Tab({ to, k }: { to: string; k: keyof typeof icons }) {
  const { t } = useTranslation();
  const label = t(`nav.${k}`);
  return (
    <NavLink to={to} className={navClassName} aria-label={label} title={label}>
      {icons[k]}
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}

/** v7 phone tab bar: Today · Backlog · + · Calendar · Dashboard. Settings opens from the avatar in each page header. */
export function BottomNav() {
  const { t } = useTranslation();
  const tab = ({ to, key }: (typeof tabs)[number]) => <Tab key={key} to={to} k={key} />;
  return (
    <nav className={styles.nav}>
      {tabs.slice(0, 2).map(tab)}
      <button
        type="button"
        className={styles.add}
        aria-label={t('sidebar.newTask')}
        title={t('sidebar.newTask')}
        onClick={() => taskForm.openNew()}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {tabs.slice(2).map(tab)}
    </nav>
  );
}
