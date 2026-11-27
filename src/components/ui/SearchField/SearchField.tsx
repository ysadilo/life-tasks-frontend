import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SearchField.module.css';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Placeholder and accessible name, e.g. "Search today". */
  label: string;
}

const magnifier = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.5" />
    <path d="m10.6 10.6 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * v7 page search: magnifier, input and a "/" key hint; "/" anywhere on the page focuses it.
 * Inside a `[data-compact]` page header (phones, or a row too narrow for it) it shrinks to a magnifier; tapping that opens
 * the field with Cancel over the header, its nearest positioned ancestor.
 */
export function SearchField({ value, onChange, label }: SearchFieldProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  // "/" jumps to search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      setOpen(true);
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const cancel = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <div className={open || value ? `${styles.root} ${styles.open}` : styles.root}>
      <button type="button" className={styles.iconButton} aria-label={label} onClick={() => setOpen(true)}>
        {magnifier(21)}
      </button>
      <div className={styles.overlay}>
        <label className={styles.search}>
          {magnifier(16)}
          <input
            ref={ref}
            type="search"
            className={styles.input}
            aria-label={label}
            placeholder={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && cancel()}
            // An empty compact search folds back when focus leaves it.
            onBlur={() => !value && setOpen(false)}
          />
          {value && (
            <button
              type="button"
              className={styles.clear}
              aria-label={t('search.clear')}
              onClick={() => {
                onChange('');
                ref.current?.focus();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="8" fill="currentColor" opacity=".35" />
                <path d="M7 7l6 6M13 7l-6 6" stroke="var(--color-surface)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <kbd className={styles.key}>/</kbd>
        </label>
        <button type="button" className={styles.cancel} onClick={cancel}>
          {t('search.cancel')}
        </button>
      </div>
    </div>
  );
}
