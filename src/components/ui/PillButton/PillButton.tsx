import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './PillButton.module.css';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** Small outlined pill for a row's secondary action (→ Today, Reflect); the checkbox stays the primary one-tap action. */
export function PillButton({ className, children, type = 'button', ...rest }: PillButtonProps) {
  return (
    <button type={type} className={[styles.pill, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  );
}
