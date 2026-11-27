import { useTranslation } from 'react-i18next';
import { useBoardMembers } from '../../hooks/useBoards';
import { splitByAssignee } from '../../lib/todaySplit';
import { formatMinutes } from '../../lib/taskMeta';
import type { Task } from '../../models';
import { memberLabel } from './memberLabel';
import styles from './board.module.css';

/** v7 greys, darkest for you; everyone after the third shares the lightest member shade. */
const MEMBER_SHADES = ['var(--color-accent)', 'var(--color-text-faint)', 'var(--color-border-strong)'];
const UNASSIGNED_SHADE = 'var(--color-border)';

/** Phone counterpart of the rail's split card (v7): "Today's split · 2h 50m", a stacked bar, one legend line. */
export function TodaySplit({ openTasks }: { openTasks: Task[] }) {
  const { t } = useTranslation();
  const { shared, members } = useBoardMembers();
  if (!shared) return null;

  const rows = splitByAssignee(openTasks, members);
  const totalMinutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  // Weigh by estimated time, falling back to task count while nothing has an estimate.
  const byTime = totalMinutes > 0;
  const weight = (row: (typeof rows)[number]) => (byTime ? row.minutes : row.count);
  const shade = (row: (typeof rows)[number], i: number) =>
    row.member ? MEMBER_SHADES[Math.min(i, MEMBER_SHADES.length - 1)] : UNASSIGNED_SHADE;
  const label = (row: (typeof rows)[number]) => (row.member ? memberLabel(row.member, t) : t('board.unassigned'));

  return (
    <section className={styles.split}>
      <span className={styles.splitLabel}>
        {t('board.split')} · {byTime ? formatMinutes(totalMinutes) : t('board.splitTotal', { count: openTasks.length })}
      </span>
      <div className={styles.splitBar}>
        {rows.map(
          (row, i) =>
            weight(row) > 0 && (
              <span key={row.member?.userId ?? 'unassigned'} style={{ flex: weight(row), background: shade(row, i) }} />
            )
        )}
      </div>
      <div className={styles.splitLegend}>
        {rows.map((row) => (
          <span key={row.member?.userId ?? 'unassigned'}>
            {label(row)} {byTime ? formatMinutes(row.minutes) : row.count}
          </span>
        ))}
      </div>
    </section>
  );
}
