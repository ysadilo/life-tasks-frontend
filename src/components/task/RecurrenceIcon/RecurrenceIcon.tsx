import { useTranslation } from 'react-i18next';
import type { Recurrence } from '../../../models';
import styles from './RecurrenceIcon.module.css';

/**
 * Fixed-size "repeats" marker for a task row. Always occupies its slot so the
 * icon's presence never shifts the row's action buttons; renders the glyph only
 * when the task actually recurs.
 */
export function RecurrenceIcon({ recurrence }: { recurrence?: Recurrence | null }) {
  const { t } = useTranslation();
  if (!recurrence) return <span className={styles.icon} aria-hidden="true" />;

  const label = t('task.recurs', { schedule: t(`taskForm.recurrenceOption.${recurrence}`) });
  return (
    <span className={styles.icon} title={label} aria-label={label} role="img">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17 2.1 21 6l-4 3.9M21 6H8a4 4 0 0 0-4 4v1M7 21.9 3 18l4-3.9M3 18h13a4 4 0 0 0 4-4v-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
