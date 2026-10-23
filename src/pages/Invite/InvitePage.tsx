import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '../../components/layout';
import { Button } from '../../components/ui';
import { BoardTile, MemberAvatar } from '../../components/board';
import { useJoinBoard, useJoinPreview } from '../../hooks/useBoards';
import styles from './InvitePage.module.css';

const MAX_AVATARS = 4;

/** Landing page for an invite link: who invited you, who is already there, Join / Not now. */
export default function InvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { code = '' } = useParams();
  const { data: invite, isLoading, isError } = useJoinPreview(code);
  const accept = useJoinBoard();

  if (isLoading) return <PageState>{t('invite.loading')}</PageState>;
  if (isError || !invite) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('invite.notFoundTitle')}</h1>
          <p className={styles.text}>{t('invite.notFoundHint')}</p>
          <Button onClick={() => navigate('/today')}>{t('invite.goToToday')}</Button>
        </div>
      </div>
    );
  }

  const inviter = invite.invitedBy.split('@')[0];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <BoardTile id={invite.boardId} name={invite.boardName} />
        <span className={styles.text}>{t('invite.invitedYou', { name: inviter })}</span>
        <h1 className={styles.title}>{invite.boardName}</h1>
        <div className={styles.people}>
          <span className={styles.avatars}>
            {invite.members.slice(0, MAX_AVATARS).map((email) => (
              <MemberAvatar key={email} email={email} />
            ))}
          </span>
          <span className={styles.text}>
            {t('invite.alreadyHere', { count: invite.members.length, tasks: invite.taskCount })}
          </span>
        </div>
        <div className={styles.role}>
          <strong>{t('invite.roleTitle')}</strong>
          <span>{t('invite.roleHint')}</span>
        </div>
        {accept.isError && <p role="alert">{t('board.actionFailed')}</p>}
        <div className={styles.actions}>
          <Button
            variant="primary"
            disabled={accept.isPending}
            onClick={() => accept.mutate(code, { onSuccess: () => navigate('/today') })}
          >
            {t('board.join')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/today')}>
            {t('invite.notNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
