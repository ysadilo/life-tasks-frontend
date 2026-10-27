import { Trans, useTranslation } from 'react-i18next';
import { useBoardMembers } from '../../hooks/useBoards';
import type { ActivityEntry } from '../../models';
import { MemberAvatar } from './BoardTile';
import { memberLabel } from './memberLabel';
import styles from './board.module.css';

function timeLabel(iso: string, locale: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} ${time}`;
}

interface ActivityRowProps {
  entry: ActivityEntry;
  locale: string;
  /** Highlights the row with a dot (mobile activity sheet). */
  unread?: boolean;
}

export function ActivityRow({ entry, locale, unread }: ActivityRowProps) {
  const { t } = useTranslation();
  const { byId } = useBoardMembers();
  const name = (userId: string | null, email: string | null) => {
    const member = userId ? byId.get(userId) : undefined;
    return member ? memberLabel(member, t) : (email ?? '').split('@')[0];
  };
  const actor = name(entry.actorId, entry.actorEmail);

  // assigned → "to you" / "to Max" / unassigned; the rest are plain verbs.
  let key: string = entry.type;
  if (entry.type === 'assigned') {
    const target = entry.targetUserId ? byId.get(entry.targetUserId) : undefined;
    key = !entry.targetUserId ? 'unassigned' : target?.isMe ? 'assignedToYou' : 'assignedTo';
  }

  return (
    <div className={[styles.activityRow, unread ? styles.activityUnread : ''].filter(Boolean).join(' ')}>
      <MemberAvatar email={entry.actorEmail} />
      <div className={styles.activityText}>
        <span>
          <Trans
            i18nKey={`board.activity.${key}`}
            values={{ actor, task: entry.taskTitle, target: name(entry.targetUserId, entry.targetEmail) }}
            components={{ b: <b /> }}
          />
        </span>
        <span className={styles.rowMeta}>{timeLabel(entry.createdAt, locale)}</span>
      </div>
      {unread && <span className={styles.unreadDot} aria-hidden />}
    </div>
  );
}
