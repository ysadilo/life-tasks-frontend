import { useEffect, useRef } from 'react';
import styles from './SearchField.module.css';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Placeholder and accessible name, e.g. "Search today". */
  label: string;
}

/** v7 page search: magnifier, input and a "/" key hint; "/" anywhere on the page focuses it. */
export function SearchField({ value, onChange, label }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);

  // "/" jumps to search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <label className={styles.search}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.6" />
        <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        type="search"
        className={styles.input}
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <kbd className={styles.key}>/</kbd>
    </label>
  );
}
