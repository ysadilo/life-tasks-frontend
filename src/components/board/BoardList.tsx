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
export function BoardList({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const { data: invites } = useBoardInvites();
  const active = useActiveBoard();
  const switchBoard = useSwitchBoard();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();

  const personal = boards?.filter((b) => !b.shared) ?? [];
  const shared = boards?.filter((b) => b.shared) ?? [];

  const renderBoard = (board: Board) => (
    <button
      key={board.id}
      type="button"
      className={[styles.row, board.id === active?.id ? styles.rowActive : ''].filter(Boolean).join(' ')}
      aria-current={board.id === active?.id}
      onClick={() => {
        if (board.id !== active?.id) switchBoard(board.id);
        onDone();
      }}
    >
      <BoardTile id={board.id} name={board.name} />
      <span className={styles.rowText}>
        <span className={styles.rowName}>{board.name}</span>
        <span className={styles.rowMeta}>
          {board.shared ? t('board.sharedMeta', { count: board.members.length }) : t('board.personal')}
        </span>
      </span>
      {board.shared && (
        <span className={styles.avatars}>
          {board.members.slice(0, MAX_AVATARS).map((m) => (
            <MemberAvatar key={m.userId} email={m.email} />
          ))}
        </span>
      )}
      {board.id === active?.id && <span aria-hidden>✓</span>}
    </button>
  );

  return (
    <div className={styles.list}>
      {personal.length > 0 && <span className={styles.groupLabel}>{t('board.personal')}</span>}
      {personal.map(renderBoard)}
      {(shared.length > 0 || !!invites?.length) && <span className={styles.groupLabel}>{t('board.shared')}</span>}
      {shared.map(renderBoard)}
      {invites?.map((invite) => (
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
