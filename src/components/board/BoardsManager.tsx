import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useActiveBoard,
  useBoards,
  useSwitchBoard,
  useDeleteBoard,
  useLeaveBoard,
  useRemoveMember,
  useRenameBoard,
  useRevokeInvite,
} from '../../hooks/useBoards';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { toast } from '../ui/Toast';
import { BoardTile, MemberAvatar } from './BoardTile';
import { newBoardModal } from './newBoardModalStore';
import type { Board } from '../../models';
import styles from './board.module.css';

function BoardCard({ board, canDelete }: { board: Board; canDelete: boolean }) {
  const { t } = useTranslation();
  const rename = useRenameBoard();
  const remove = useDeleteBoard();
  const leave = useLeaveBoard();
  const removeMember = useRemoveMember();
  const revoke = useRevokeInvite();
  const active = useActiveBoard();
  const switchBoard = useSwitchBoard();
  const current = active?.id === board.id;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name);
  const owner = board.role === 'owner';

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === board.name) return setEditing(false);
    rename.mutate(
      { id: board.id, name: trimmed },
      {
        onSuccess: () => {
          setEditing(false);
          toast.show(t('board.renamed'));
        },
        onError: () => toast.show(t('board.actionFailed')),
      }
    );
  };

  const [pending, setPending] = useState<{ message: string; confirmLabel: string; run: () => void } | null>(null);
  const confirmThen = (message: string, confirmLabel: string, run: () => void) =>
    setPending({ message, confirmLabel, run });
  // Every board action reports its outcome in a toast.
  const notify = (done: string) => ({
    onSuccess: () => toast.show(done),
    onError: () => toast.show(t('board.actionFailed')),
  });

  return (
    <div className={[styles.manageCard, current ? styles.manageCardCurrent : ''].filter(Boolean).join(' ')}>
      <div className={styles.manageHeader}>
        <BoardTile id={board.id} name={board.name} />
        <span className={styles.rowText}>
          <span className={styles.rowName}>{board.name}</span>
          <span className={styles.rowMeta}>
            {board.shared ? t('board.sharedMeta', { count: board.members.length }) : t('board.personal')} ·{' '}
            {t(`board.role.${board.role}`)}
          </span>
        </span>
        {current ? (
          <span className={styles.currentPill}>{t('board.current')}</span>
        ) : (
          <button type="button" className={styles.linkButton} onClick={() => switchBoard(board.id)}>
            {t('board.switch')}
          </button>
        )}
        <button type="button" className={styles.linkButton} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {t('board.manage')}
        </button>
      </div>

      {open && (
        <div className={styles.manageActions}>
          {editing ? (
            <form
              className={styles.inviteForm}
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              />
              <Button type="submit" variant="primary" disabled={!name.trim() || rename.isPending}>
                {t('board.save')}
              </Button>
            </form>
          ) : (
            owner && (
              <button type="button" className={styles.linkButton} onClick={() => setEditing(true)}>
                {t('board.rename')}
              </button>
            )
          )}
          {owner && canDelete && (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() =>
                confirmThen(t('board.deleteConfirm', { name: board.name }), t('board.delete'), () =>
                  remove.mutate(board.id, notify(t('board.deleted', { name: board.name })))
                )
              }
            >
              {t('board.delete')}
            </button>
          )}
          {!owner && (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() =>
                confirmThen(t('board.leaveConfirm', { name: board.name }), t('board.leave'), () =>
                  leave.mutate(board.id, notify(t('board.left', { name: board.name })))
                )
              }
            >
              {t('board.leave')}
            </button>
          )}
        </div>
      )}

      {open && board.shared && (
        <div className={styles.manageMembers}>
          {board.members.map((m) => (
            <div key={m.userId} className={styles.member}>
              <MemberAvatar email={m.email} />
              <span className={styles.rowText}>
                <span className={styles.memberName}>{m.email}</span>
                <span className={styles.rowMeta}>{t(`board.role.${m.role}`)}</span>
              </span>
              {owner && !m.isMe && (
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() =>
                    confirmThen(t('board.removeMemberConfirm', { email: m.email }), t('board.remove'), () =>
                      removeMember.mutate(
                        { boardId: board.id, userId: m.userId },
                        notify(t('board.memberRemoved', { email: m.email }))
                      )
                    )
                  }
                >
                  {t('board.remove')}
                </button>
              )}
            </div>
          ))}
          {(board.invites ?? []).map((invite) => (
            <div key={invite.id} className={styles.member}>
              <MemberAvatar email={invite.email} />
              <span className={styles.rowText}>
                <span className={styles.memberName}>{invite.email}</span>
                <span className={styles.rowMeta}>{t('board.invitePending')}</span>
              </span>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() =>
                  revoke.mutate(
                    { boardId: board.id, inviteId: invite.id },
                    notify(t('board.inviteRevoked', { email: invite.email }))
                  )
                }
              >
                {t('board.revoke')}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={board.name}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel ?? ''}
        cancelLabel={t('board.cancel')}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          pending?.run();
          setPending(null);
        }}
      />
    </div>
  );
}

/** Settings card: rename, delete or leave boards, and manage who is on shared ones. */
export function BoardsManager() {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const ownedCount = boards?.filter((b) => b.role === 'owner').length ?? 0;

  return (
    <div className={styles.manager}>
      {boards?.map((board) => (
        <BoardCard key={board.id} board={board} canDelete={ownedCount > 1} />
      ))}
      <Button onClick={newBoardModal.open}>{t('board.newSharedBoard')}</Button>
    </div>
  );
}
