import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfileAvatar, SettingsIcon } from '../../ui';
import { ActivityBell, BoardPill } from '../../board';
import { useCollapseOnWrap } from '../../../hooks/useCollapseOnWrap';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useMyProfile } from '../../../hooks/useMyProfile';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  /** Line above the title (its own row), e.g. the date, or the applied filters on phones. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /**
   * Controls that always share the title row (search, filters). Phones, and any width where they would wrap under the
   * title, mark the header `data-compact` so they shrink to icons.
   */
  tools?: ReactNode;
  /** Wider controls; on phones they wrap onto their own row. */
  actions?: ReactNode;
  /** Phones (v7): the board pill row above the title, the activity bell and the avatar that opens Settings. Off on Settings itself. */
  profile?: boolean;
}

function ProfileLink() {
  const { t } = useTranslation();
  const { displayName, avatarSrc } = useMyProfile();
  return (
    <Link to="/settings" className={styles.profile} aria-label={t('nav.account')}>
      <ProfileAvatar src={avatarSrc} name={displayName} className={styles.avatar} />
      <span className={styles.gear}>
        <SettingsIcon size={11} />
      </span>
    </Link>
  );
}

export function PageHeader({ title, eyebrow, subtitle, tools, actions, profile = true }: PageHeaderProps) {
  const isMobile = useIsMobile();
  const boardControls = isMobile && profile;
  // v7 phones: only the title shares its row with the tools, so the subtitle moves up beside the eyebrow.
  const above = eyebrow ?? (boardControls ? subtitle : undefined);
  const below = boardControls ? undefined : subtitle;
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const wraps = useCollapseOnWrap(headerRef, titleRef, toolsRef);
  return (
    <div ref={headerRef} className={styles.header} data-compact={isMobile || wraps || undefined}>
      {/* v7: the board pill and the eyebrow each have a row of their own; the title and tools share the last one. */}
      {boardControls && (
        <div className={styles.fullRow}>
          <BoardPill />
        </div>
      )}
      {above && <div className={`${styles.fullRow} ${styles.eyebrow} ${styles.subtitle}`}>{above}</div>}
      <div ref={titleRef} className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {below && <span className={styles.subtitle}>{below}</span>}
      </div>
      {(tools || boardControls) && (
        <div ref={toolsRef} className={styles.tools}>
          {tools}
          {boardControls && (
            <>
              <ActivityBell />
              <ProfileLink />
            </>
          )}
        </div>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
