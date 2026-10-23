import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveBoard, useInviteToBoard } from '../../hooks/useBoards';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';
import { MemberAvatar } from './BoardTile';
import styles from './board.module.css';

/** Sidebar members list for a shared board; the owner can invite by email. */
export function MembersSection() {
  const { t } = useTranslation();
  const board = useActiveBoard();
  const invite = useInviteToBoard();
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');

  if (!board?.shared) return null;

  const closeInvite = () => {
    setInviting(false);
    setEmail('');
  };

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    invite.mutate(
      { boardId: board.id, email: value },
      {
        onSuccess: () => {
          setEmail('');
          setInviting(false);
          toast.show(t('board.inviteSent', { email: value }));
        },
        onError: () => toast.show(t('board.inviteFailed')),
      }
    );
  };

  return (
    <div className={styles.members}>
      <div className={styles.membersHeader}>
        <span className={styles.groupLabel}>{t('board.members')}</span>
        {board.role === 'owner' && (
          <button type="button" className={styles.linkButton} onClick={() => setInviting((v) => !v)}>
            {inviting ? t('board.cancel') : t('board.invite')}
          </button>
        )}
      </div>
      {inviting && (
        <form className={styles.inviteForm} onSubmit={onInvite}>
          <Input
            autoFocus
            type="email"
            value={email}
            placeholder={t('board.emailPlaceholder')}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && closeInvite()}
          />
          <button type="button" className={styles.declineButton} aria-label={t('board.cancel')} onClick={closeInvite}>
            ×
          </button>
        </form>
      )}
      {board.members.map((m) => (
        <div key={m.userId} className={styles.member}>
          <MemberAvatar email={m.email} />
          <span className={styles.rowText}>
            <span className={styles.memberName}>{m.email}</span>
            <span className={styles.rowMeta}>{t(`board.role.${m.role}`)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
