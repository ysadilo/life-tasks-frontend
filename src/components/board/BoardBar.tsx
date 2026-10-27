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

/** Mobile-only top bar: the active board is always visible and opens the board sheet; shared boards add members and a bell. */
export function BoardBar() {
  const { t } = useTranslation();
  const board = useActiveBoard();
  const { data: invites } = useBoardInvites();
  const { shared, me } = useBoardMembers();
  const { data: activity } = useActivity(shared);
  const { seenAt, markSeen } = useActivitySeen(board?.id);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const isUnread = (entry: ActivityEntry) =>
    new Date(entry.createdAt).getTime() > seenAt && entry.actorId !== me?.userId;
  const unread = (activity ?? []).filter(isUnread).length;

  const closeActivity = () => {
    setActivityOpen(false);
    markSeen();
  };

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.barBoard} aria-haspopup="true" onClick={() => setBoardsOpen(true)}>
        {board && <BoardTile id={board.id} name={board.name} />}
        <span className={styles.barName}>{board?.name ?? '…'}</span>
        <svg
          className={styles.barChevron}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        {!!invites?.length && <span className={styles.badge}>{invites.length}</span>}
      </button>
      {shared && board && (
        <>
          <span className={styles.avatars}>
            {board.members.slice(0, MAX_AVATARS).map((m) => (
              <MemberAvatar key={m.userId} email={m.email} />
            ))}
          </span>
          <button
            type="button"
            className={styles.bell}
            aria-label={t('board.activityTitle')}
            onClick={() => setActivityOpen(true)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
              <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && <span className={styles.bellBadge}>{unread}</span>}
          </button>
        </>
      )}

      <SidePanel open={boardsOpen} onClose={() => setBoardsOpen(false)} title={t('board.boards')}>
        <div className={styles.sheetBody}>
          <BoardList onDone={() => setBoardsOpen(false)} />
        </div>
      </SidePanel>
      <ActivitySheet
        open={activityOpen}
        onClose={closeActivity}
        entries={activity ?? []}
        isUnread={isUnread}
        onMarkAllRead={markSeen}
      />
    </div>
  );
}
