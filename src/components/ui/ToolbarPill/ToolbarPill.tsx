import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './ToolbarPill.module.css';

interface ToolbarPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Highlights the pill (e.g. filters applied). */
  active?: boolean;
  /** Shows a ▾ after the label for pills that open a popover. */
  caret?: boolean;
}

/** Page-toolbar pill for Group / Sort / Filter triggers. */
export function ToolbarPill({ active, caret, className, children, type = 'button', ...rest }: ToolbarPillProps) {
  return (
    <button
      type={type}
      className={[styles.pill, active && styles.active, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {caret && <span className={styles.caret} aria-hidden />}
    </button>
  );
}
