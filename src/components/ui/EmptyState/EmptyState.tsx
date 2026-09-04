import type { ReactNode } from 'react';
import { EmptyStateIcon } from '../EmptyStateIcon';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <EmptyStateIcon />
      </div>
      <div className={styles.copy}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      {action}
    </div>
  );
}
