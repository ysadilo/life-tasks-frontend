import { useTranslation } from 'react-i18next';
import styles from './RoutinesToggle.module.css';

interface RoutinesToggleProps {
  count: number;
  open: boolean;
  onToggle: () => void;
  className?: string;
}

/** "↻ 2 routines": recurring tasks stay folded into one line until it's clicked. */
export function RoutinesToggle({ count, open, onToggle, className }: RoutinesToggleProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      aria-expanded={open}
      onClick={onToggle}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17 2.1 21 6l-4 3.9M21 6H8a4 4 0 0 0-4 4v1M7 21.9 3 18l4-3.9M3 18h13a4 4 0 0 0 4-4v-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t('calendar.routines', { count })}
      <span className={styles.caret} aria-hidden="true" />
    </button>
  );
}
