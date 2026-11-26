import type { ReactNode } from 'react';
import styles from './SectionLabel.module.css';

/** v7 small uppercase label heading a list or rail section ("Up next", "Filters", "Today's load"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}
