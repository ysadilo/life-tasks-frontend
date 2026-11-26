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

/** Shared Today's rail sections, under the filters: how open work is split between members, and what happened lately. */
export function TodayRail({ openTasks }: { openTasks: Task[] }) {
  const { t, i18n } = useTranslation();
  const { shared, members } = useBoardMembers();
  const { data: activity } = useActivity(shared);

  if (!shared) return null;

  const split = splitByAssignee(openTasks, members);
  // Bars show each person's share of the estimated time, or of the task count while nothing has an estimate.
  const totalMinutes = split.reduce((sum, row) => sum + row.minutes, 0);

  return (
    <>
      <section className={styles.railSection}>
        <span className={styles.groupLabel}>{t('board.split')}</span>
        {split.map(({ member, count, minutes }) => (
          <div key={member?.userId ?? 'unassigned'} className={styles.splitItem}>
            <div className={styles.splitRow}>
              {member ? (
                <MemberAvatar email={member.email} avatarKey={member.avatarKey} />
              ) : (
                <span className={styles.avatarEmpty} />
              )}
              <span className={styles.splitName}>{member ? memberLabel(member, t) : t('board.unassigned')}</span>
              <span className={styles.rowMeta}>
                {totalMinutes > 0 ? formatMinutes(minutes) : t('board.splitTotal', { count })}
              </span>
            </div>
            <div className={styles.splitTrack}>
              <div
                className={styles.splitFill}
                style={{
                  width: `${((totalMinutes > 0 ? minutes : count) / (totalMinutes || openTasks.length || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className={styles.railSection}>
        <span className={styles.groupLabel}>{t('board.activityTitle')}</span>
        {activity?.length === 0 && <span className={styles.rowMeta}>{t('board.activityEmpty')}</span>}
        {activity?.map((entry) => (
          <ActivityRow key={entry.id} entry={entry} locale={i18n.language} />
        ))}
      </section>
    </>
  );
}
