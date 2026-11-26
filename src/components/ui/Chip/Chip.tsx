import type { ReactNode } from 'react';
import styles from './Chip.module.css';

/** `plain` is row metadata: text only, no fill (v7 task rows). */
export type ChipVariant = 'neutral' | 'accent' | 'danger' | 'success' | 'info' | 'plain';

interface ChipProps {
  variant?: ChipVariant;
  pill?: boolean;
  /** Colour of a leading round dot (e.g. a life area). */
  dot?: string;
  children: ReactNode;
}

export function Chip({ variant = 'neutral', pill = false, dot, children }: ChipProps) {
  const classes = [styles.chip, styles[variant], pill ? styles.pill : ''].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {dot && <span className={styles.dot} style={{ background: dot }} aria-hidden />}
      {children}
    </span>
  );
}
