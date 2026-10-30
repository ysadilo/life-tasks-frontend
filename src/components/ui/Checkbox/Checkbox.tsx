import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  /** `done` (green) completes a task; `select` (solid dark) only includes an item, so it can't be mistaken for done. */
  tone?: 'done' | 'select';
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, tone = 'done', disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={[styles.checkbox, tone === 'select' ? styles.select : '', checked ? styles.checked : '']
        .filter(Boolean)
        .join(' ')}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.2 5 8.5l4.5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
