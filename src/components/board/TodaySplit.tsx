import { useTranslation } from 'react-i18next';
import { useBoardMembers } from '../../hooks/useBoards';
import { splitByAssignee } from '../../lib/todaySplit';
import { formatMinutes } from '../../lib/taskMeta';
import type { Task } from '../../models';
import { colorFor } from './boardColors';
import { MemberAvatar } from './BoardTile';
import { memberLabel } from './memberLabel';
import styles from './board.module.css';

/** Mobile counterpart of the rail's split card: a proportional bar plus one chip per member. */
export function TodaySplit({ openTasks }: { openTasks: Task[] }) {
  const { t } = useTranslation();
  const { shared, members } = useBoardMembers();
  if (!shared) return null;

  const rows = splitByAssignee(openTasks, members);
  const totalMinutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  // Weigh by estimated time, falling back to task count while nothing has an estimate.
  const weight = (row: (typeof rows)[number]) => (totalMinutes > 0 ? row.minutes : row.count);

  return (
    <section className={styles.split}>
      <div className={styles.splitHeader}>
        <span className={styles.groupLabel}>{t('board.split')}</span>
        <span className={styles.rowMeta}>
          {t('board.splitTotal', { count: openTasks.length })}
          {totalMinutes > 0 && ` · ${formatMinutes(totalMinutes)}`}
        </span>
      </div>
      <div className={styles.splitBar}>
        {rows
          .filter((row) => weight(row) > 0)
          .map((row) => (
            <span
              key={row.member?.userId ?? 'unassigned'}
              className={row.member ? undefined : styles.splitBarEmpty}
              style={{ flex: weight(row), background: row.member ? colorFor(row.member.email) : undefined }}
            />
          ))}
      </div>
      <div className={styles.splitChips}>
        {rows.map(({ member, count, minutes }) => (
          <div key={member?.userId ?? 'unassigned'} className={styles.splitChip}>
            {member ? (
              <MemberAvatar email={member.email} avatarKey={member.avatarKey} />
            ) : (
              <span className={styles.avatarEmpty} />
            )}
            <span className={styles.splitChipText}>
              <span className={styles.splitChipName}>{member ? memberLabel(member, t) : t('board.unassigned')}</span>
              <span className={styles.rowMeta}>
                {count}
                {minutes > 0 && ` · ${formatMinutes(minutes)}`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
