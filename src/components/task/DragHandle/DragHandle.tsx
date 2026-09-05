import type { PointerEvent } from 'react';
import styles from './DragHandle.module.css';

interface DragHandleProps {
  label: string;
  dragging?: boolean;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
}

export function DragHandle({ label, dragging = false, onPointerDown }: DragHandleProps) {
  return (
    <button
      type="button"
      className={dragging ? `${styles.handle} ${styles.dragging}` : styles.handle}
      onPointerDown={onPointerDown}
      aria-label={label}
    >
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
        <circle cx="2.5" cy="2.5" r="1.4" />
        <circle cx="7.5" cy="2.5" r="1.4" />
        <circle cx="2.5" cy="8" r="1.4" />
        <circle cx="7.5" cy="8" r="1.4" />
        <circle cx="2.5" cy="13.5" r="1.4" />
        <circle cx="7.5" cy="13.5" r="1.4" />
      </svg>
    </button>
  );
}
