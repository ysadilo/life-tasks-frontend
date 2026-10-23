import { Trans, useTranslation } from 'react-i18next';
import { useActivity } from '../../hooks/useActivity';
import { useBoardMembers } from '../../hooks/useBoards';
import { splitByAssignee } from '../../lib/todaySplit';
import { formatMinutes } from '../../lib/taskMeta';
import type { ActivityEntry, Task } from '../../models';
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

function ActivityRow({ entry, locale }: { entry: ActivityEntry; locale: string }) {
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
    <div className={styles.activityRow}>
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
    </div>
  );
}

/** Right rail of a shared Today: how open work is split between members, and what happened lately. */
export function TodayRail({ openTasks }: { openTasks: Task[] }) {
  const { t, i18n } = useTranslation();
  const { shared, members } = useBoardMembers();
  const { data: activity } = useActivity(shared);

  if (!shared) return null;

  return (
    <aside className={styles.rail}>
      <section className={styles.railCard}>
        <span className={styles.groupLabel}>{t('board.split')}</span>
        {splitByAssignee(openTasks, members).map(({ member, count, minutes }) => (
          <div key={member?.userId ?? 'unassigned'} className={styles.splitRow}>
            {member ? <MemberAvatar email={member.email} /> : <span className={styles.avatarEmpty} />}
            <span className={styles.splitName}>{member ? memberLabel(member, t) : t('board.unassigned')}</span>
            <span className={styles.rowMeta}>
              {count}
              {minutes > 0 && ` · ${formatMinutes(minutes)}`}
            </span>
          </div>
        ))}
      </section>

      <section className={styles.railCard}>
        <span className={styles.groupLabel}>{t('board.activityTitle')}</span>
        {activity?.length === 0 && <span className={styles.rowMeta}>{t('board.activityEmpty')}</span>}
        {activity?.map((entry) => (
          <ActivityRow key={entry.id} entry={entry} locale={i18n.language} />
        ))}
      </section>
    </aside>
  );
}
