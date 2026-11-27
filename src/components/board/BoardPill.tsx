import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '../ui';
import type { ActivityEntry } from '../../models';
import { useActivity } from '../../hooks/useActivity';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { useActiveBoard, useBoardInvites, useBoardMembers } from '../../hooks/useBoards';
import { ActivitySheet } from './ActivitySheet';
import { BoardList } from './BoardList';
import { BoardTile, MemberAvatar } from './BoardTile';
import styles from './board.module.css';

const MAX_AVATARS = 3;

/** v7 phones: the board switcher above a page title (tile, name, members on shared boards, chevron). */
export function BoardPill() {
  const { t } = useTranslation();
  const board = useActiveBoard();
  const { data: invites } = useBoardInvites();
  const { shared } = useBoardMembers();
  const [open, setOpen] = useState(false);

  if (!board) return null;

  return (
    <>
      <button type="button" className={styles.pill} aria-haspopup="true" onClick={() => setOpen(true)}>
        <BoardTile id={board.id} name={board.name} coverKey={board.coverKey} />
        <span className={styles.pillName}>{board.name}</span>
        {shared && (
          <span className={styles.avatars}>
            {board.members.slice(0, MAX_AVATARS).map((m) => (
              <MemberAvatar key={m.userId} email={m.email} avatarKey={m.avatarKey} />
            ))}
          </span>
        )}
        <svg className={styles.pillChevron} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!!invites?.length && <span className={styles.badge}>{invites.length}</span>}
      </button>
      <SidePanel open={open} onClose={() => setOpen(false)} title={t('board.boards')}>
        <div className={styles.sheetBody}>
          <BoardList onDone={() => setOpen(false)} />
        </div>
      </SidePanel>
    </>
  );
}

/** v7 phones, shared boards: the activity bell beside the avatar, with an unread count. */
export function ActivityBell() {
  const { t } = useTranslation();
  const board = useActiveBoard();
  const { shared, me } = useBoardMembers();
  const { data: activity } = useActivity(shared);
  const { seenAt, markSeen } = useActivitySeen(board?.id);
  const [open, setOpen] = useState(false);

  if (!shared) return null;

  const isUnread = (entry: ActivityEntry) =>
    new Date(entry.createdAt).getTime() > seenAt && entry.actorId !== me?.userId;
  const unread = (activity ?? []).filter(isUnread).length;
  const close = () => {
    setOpen(false);
    markSeen();
  };

  return (
    <>
      <button type="button" className={styles.bell} aria-label={t('board.activityTitle')} onClick={() => setOpen(true)}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className={styles.bellBadge}>{unread}</span>}
      </button>
      <ActivitySheet
        open={open}
        onClose={close}
        entries={activity ?? []}
        isUnread={isUnread}
        onMarkAllRead={markSeen}
      />
    </>
  );
}
