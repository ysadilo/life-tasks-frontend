import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoards, useInviteToBoard } from '../../hooks/useBoards';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';
import { InviteLinkSettings } from './InviteLink';
import { inviteModal, useInviteModalBoardId } from './inviteModalStore';
import styles from './board.module.css';

/** Mount once (see AppShell); opened via `inviteModal.open(boardId)`. Share the join link or invite by email. */
export function InviteModal() {
  const boardId = useInviteModalBoardId();
  const { t } = useTranslation();

  return (
    <Modal open={!!boardId} onClose={inviteModal.close} closeLabel={t('board.close')} title={t('board.invitePeople')}>
      {boardId && <InviteBody boardId={boardId} />}
    </Modal>
  );
}

function InviteBody({ boardId }: { boardId: string }) {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const invite = useInviteToBoard();
  const [email, setEmail] = useState('');
  const board = boards?.find((b) => b.id === boardId);
  if (!board) return null;

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    invite.mutate(
      { boardId, email: value },
      {
        onSuccess: () => {
          setEmail('');
          toast.show(t('board.inviteSent', { email: value }));
        },
        onError: () => toast.show(t('board.inviteFailed')),
      }
    );
  };

  return (
    <div className={styles.form}>
      <InviteLinkSettings boardId={boardId} code={board.inviteCode} />
      <form className={styles.field} onSubmit={onInvite}>
        <span className={styles.fieldLabel}>{t('board.inviteByEmail')}</span>
        <div className={styles.inviteRow}>
          <Input
            type="email"
            value={email}
            placeholder={t('board.emailPlaceholder')}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={!email.trim() || invite.isPending}>
            {t('board.invite')}
          </Button>
        </div>
        {board.invites.length > 0 && (
          <p className={styles.hint}>{t('board.pendingInvites', { count: board.invites.length })}</p>
        )}
      </form>
    </div>
  );
}
