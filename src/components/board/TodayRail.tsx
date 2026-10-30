import { useTranslation } from 'react-i18next';
import { useActivity } from '../../hooks/useActivity';
import { useBoardMembers } from '../../hooks/useBoards';
import { splitByAssignee } from '../../lib/todaySplit';
import { formatMinutes } from '../../lib/taskMeta';
import type { Task } from '../../models';
import { ActivityRow } from './ActivityRow';
import { MemberAvatar } from './BoardTile';
import { memberLabel } from './memberLabel';
import styles from './board.module.css';

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
            {member ? (
              <MemberAvatar email={member.email} avatarKey={member.avatarKey} />
            ) : (
              <span className={styles.avatarEmpty} />
            )}
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
