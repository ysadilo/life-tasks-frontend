import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAcceptInvite,
  useActiveBoard,
  useBoardInvites,
  useBoards,
  useDeclineInvite,
  useSwitchBoard,
} from '../../hooks/useBoards';
import { BoardTile, MemberAvatar } from './BoardTile';
import { newBoardModal } from './newBoardModalStore';
import type { Board } from '../../models';
import styles from './board.module.css';

const MAX_AVATARS = 3;

/** Board picker body, shared by the sidebar popover and the mobile menu. `onDone` fires after any choice. */
export function BoardList({ onDone, searchable = false }: { onDone: () => void; searchable?: boolean }) {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const { data: invites } = useBoardInvites();
  const active = useActiveBoard();
  const switchBoard = useSwitchBoard();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();

  const [query, setQuery] = useState('');
  const matches = (name: string) => name.toLowerCase().includes(query.trim().toLowerCase());
  const visible = boards?.filter((b) => matches(b.name)) ?? [];
  const visibleInvites = invites?.filter((i) => matches(i.boardName));
  const personal = visible.filter((b) => !b.shared);
  const shared = visible.filter((b) => b.shared);

  const pick = (board: Board) => {
    if (board.id !== active?.id) switchBoard(board.id);
    onDone();
  };

  const renderBoard = (board: Board) => (
    <button
      key={board.id}
      type="button"
      className={[styles.row, board.id === active?.id ? styles.rowActive : ''].filter(Boolean).join(' ')}
      aria-current={board.id === active?.id}
      onClick={() => pick(board)}
    >
      <BoardTile id={board.id} name={board.name} coverKey={board.coverKey} />
      <span className={styles.rowText}>
        <span className={styles.rowName}>{board.name}</span>
        <span className={styles.rowMeta}>
          {board.shared
            ? t('board.sharedCounts', { today: board.counts?.today ?? 0, forYou: board.counts?.forYou ?? 0 })
            : t('board.personalCounts', { today: board.counts?.today ?? 0, backlog: board.counts?.backlog ?? 0 })}
        </span>
      </span>
      {board.shared && (
        <span className={styles.avatars}>
          {board.members.slice(0, MAX_AVATARS).map((m) => (
            <MemberAvatar key={m.userId} email={m.email} avatarKey={m.avatarKey} />
          ))}
        </span>
      )}
      {board.id === active?.id && <span aria-hidden>✓</span>}
    </button>
  );

  return (
    <div className={styles.list}>
      {searchable && (
        <div className={styles.search}>
          <input
            autoFocus
            className={styles.searchInput}
            type="search"
            value={query}
            placeholder={t('board.find')}
            aria-label={t('board.find')}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              const first = visible[0];
              if (e.key === 'Enter' && first) pick(first);
            }}
          />
          <kbd className={styles.kbd}>⌘B</kbd>
        </div>
      )}
      {personal.length > 0 && <span className={styles.groupLabel}>{t('board.personal')}</span>}
      {personal.map(renderBoard)}
      {(shared.length > 0 || !!visibleInvites?.length) && (
        <span className={styles.groupLabel}>{t('board.shared')}</span>
      )}
      {shared.map(renderBoard)}
      {visibleInvites?.map((invite) => (
        <div key={invite.id} className={styles.row}>
          <BoardTile id={invite.boardId} name={invite.boardName} />
          <span className={styles.rowText}>
            <span className={styles.rowName}>{invite.boardName}</span>
            <span className={styles.rowMeta}>{t('board.invitePending')}</span>
          </span>
          <button
            type="button"
            className={styles.declineButton}
            aria-label={t('board.decline')}
            disabled={decline.isPending}
            onClick={() => decline.mutate(invite.id)}
          >
            ×
          </button>
          <button
            type="button"
            className={styles.joinButton}
            disabled={accept.isPending}
            onClick={() => accept.mutate(invite.id, { onSuccess: onDone })}
          >
            {t('board.join')}
          </button>
        </div>
      ))}
      {query && visible.length === 0 && !visibleInvites?.length && (
        <span className={styles.groupLabel}>{t('board.noMatches')}</span>
      )}
      <button
        type="button"
        className={styles.newBoard}
        onClick={() => {
          onDone();
          newBoardModal.open();
        }}
      >
        {t('board.newBoard')}
        <kbd className={styles.kbd}>⌘⇧B</kbd>
      </button>
    </div>
  );
}
