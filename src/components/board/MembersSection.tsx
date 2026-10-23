import { useTranslation } from 'react-i18next';
import { useActiveBoard } from '../../hooks/useBoards';
import { MemberAvatar } from './BoardTile';
import { inviteModal } from './inviteModalStore';
import styles from './board.module.css';

/** Sidebar members list for a shared board; the owner's Invite opens the invite popup. */
export function MembersSection() {
  const { t } = useTranslation();
  const board = useActiveBoard();

  if (!board?.shared) return null;

  return (
    <div className={styles.members}>
      <div className={styles.membersHeader}>
        <span className={styles.groupLabel}>{t('board.members')}</span>
        {board.role === 'owner' && (
          <button type="button" className={styles.linkButton} onClick={() => inviteModal.open(board.id)}>
            {t('board.invite')}
          </button>
        )}
      </div>
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
