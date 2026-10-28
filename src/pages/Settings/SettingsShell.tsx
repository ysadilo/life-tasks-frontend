import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/layout';
import styles from './Settings.module.css';

export interface SettingsSection {
  id: string;
  label: string;
  /** Small trailing text, e.g. a count. */
  meta?: string;
}

interface SettingsShellProps {
  page: 'general' | 'agents';
  /** What "On this page" lists: the cards on the current page. */
  sections: SettingsSection[];
  /** Mobile page header. */
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const PAGES = [
  { page: 'general', to: '/settings' },
  { page: 'agents', to: '/settings/agents' },
] as const;

/** The Settings frame: a page index and a section index on the left, the page's cards on the right. */
export function SettingsShell({ page, sections, title, subtitle, children }: SettingsShellProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(sections[0]?.id);
  const sectionKey = sections.map((s) => s.id).join();

  // Highlight the section nearest the top of the scroll area.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '0px 0px -70% 0px' }
    );
    sectionKey.split(',').forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionKey]);

  const goTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.mobileHeader}>
        {page !== 'general' && (
          <Link to="/settings" className={styles.back}>
            ‹ {t('settings.title')}
          </Link>
        )}
        <PageHeader title={title} subtitle={subtitle} />
        {page === 'general' && (
          <Link to="/settings/agents" className={styles.mobileLink}>
            <span>
              <b>{t('settings.nav.agents')}</b>
              <span>{t('settings.agentsHint')}</span>
            </span>
            ›
          </Link>
        )}
      </div>

      <nav className={styles.nav} aria-label={t('settings.onThisPage')}>
        <h1 className={styles.navTitle}>{t('settings.title')}</h1>
        {PAGES.map(({ page: id, to }) => (
          <NavLink
            key={id}
            to={to}
            end
            className={({ isActive }) =>
              [styles.pageLink, isActive ? styles.pageLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {t(`settings.pages.${id}`)}
                {!isActive && <span className={styles.pageMeta}>{t(`settings.pageHints.${id}`)} ›</span>}
              </>
            )}
          </NavLink>
        ))}
        <span className={styles.navLabel}>{t('settings.onThisPage')}</span>
        <div className={styles.navList}>
          {sections.map(({ id, label, meta }) => (
            <button
              key={id}
              type="button"
              className={[styles.navItem, id === active ? styles.navItemActive : ''].filter(Boolean).join(' ')}
              aria-current={id === active}
              onClick={() => goTo(id)}
            >
              {label}
              {meta && <span className={styles.navMeta}>{meta}</span>}
            </button>
          ))}
        </div>
        <span className={styles.navFootnote}>{t('settings.autosave')}</span>
      </nav>

      <div className={styles.sections}>{children}</div>
    </div>
  );
}
