import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskForm } from '../../task';
import styles from './BottomNav.module.css';

const svg = (children: ReactNode, w = 1.6) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth={w}>
    {children}
  </svg>
);

const icons = {
  today: svg(
    <>
      <circle cx="10" cy="10" r="3.6" />
      <path
        d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M15.3 4.7 14 6M6 14l-1.3 1.3"
        strokeLinecap="round"
      />
    </>
  ),
  backlog: svg(
    <>
      <path
        d="M3 11.5 4.8 5a1.5 1.5 0 0 1 1.4-1h7.6a1.5 1.5 0 0 1 1.4 1L17 11.5V15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15v-3.5Z"
        strokeLinejoin="round"
      />
      <path d="M3 11.5h4l1 2h4l1-2h4" strokeLinejoin="round" />
    </>
  ),
  calendar: svg(
    <>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
      <path d="M3 8.5h14M7 2.8v3M13 2.8v3" strokeLinecap="round" />
    </>
  ),
  dashboard: svg(<path d="M4 16.5V11M10 16.5V4M16 16.5V8" strokeLinecap="round" />, 2),
  settings: svg(
    <>
      <path
        d="M16.05 8.24 L18.19 8.64 L18.19 11.36 L16.05 11.76 L15.52 13.04 L16.75 14.83 L14.83 16.75 L13.04 15.52 L11.76 16.05 L11.36 18.19 L8.64 18.19 L8.24 16.05 L6.96 15.52 L5.17 16.75 L3.25 14.83 L4.48 13.04 L3.95 11.76 L1.81 11.36 L1.81 8.64 L3.95 8.24 L4.48 6.96 L3.25 5.17 L5.17 3.25 L6.96 4.48 L8.24 3.95 L8.64 1.81 L11.36 1.81 L11.76 3.95 L13.04 4.48 L14.83 3.25 L16.75 5.17 L15.52 6.96 Z"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" />
    </>,
    1.5
  ),
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

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Tab key={tab.key} to={tab.to} k={tab.key} />
      ))}
      <Tab to="/settings" k="settings" />
      <button
        type="button"
        className={styles.add}
        aria-label={t('sidebar.newTask')}
        title={t('sidebar.newTask')}
        onClick={() => taskForm.openNew()}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  );
}
