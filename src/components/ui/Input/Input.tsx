import type { InputHTMLAttributes, MouseEvent } from 'react';
import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, onClick, ...rest }: InputProps) {
  // Native date/time inputs only open their picker from the icon; open it on any click.
  const handleClick = (e: MouseEvent<HTMLInputElement>) => {
    onClick?.(e);
    if (rest.type === 'date' || rest.type === 'time' || rest.type === 'datetime-local') {
      try {
        e.currentTarget.showPicker();
      } catch {
        // showPicker is unsupported or blocked; the native icon still works.
      }
    }
  };

  return <input className={[styles.input, className].filter(Boolean).join(' ')} onClick={handleClick} {...rest} />;
}
