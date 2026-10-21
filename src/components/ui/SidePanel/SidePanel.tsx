import { useEffect, type ReactNode } from 'react';
import styles from './SidePanel.module.css';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}

/** Non-modal panel that sits beside the page content (full-screen on mobile). Mount as a flex sibling of <main>. */
export function SidePanel({ open, onClose, title, closeLabel = 'Close', children }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // A nested dialog (e.g. the link editor) owns Escape while it is open.
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('dialog[open]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <aside className={styles.panel} aria-label={title}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
