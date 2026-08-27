import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipVariant = 'neutral' | 'accent' | 'danger' | 'success' | 'info';

interface ChipProps {
  variant?: ChipVariant;
  pill?: boolean;
  children: ReactNode;
}

export function Chip({ variant = 'neutral', pill = false, children }: ChipProps) {
  const classes = [styles.chip, styles[variant], pill ? styles.pill : ''].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
