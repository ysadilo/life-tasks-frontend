import type { InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../Input';
import styles from './DateField.module.css';

interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

/** Date input with a clear button that appears once a date is set. */
export function DateField({ value, onChange, ...rest }: DateFieldProps) {
  const { t } = useTranslation();
  return (
    <span className={styles.wrap}>
      <Input {...rest} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      <button
        type="button"
        className={styles.clear}
        aria-label={t('taskForm.clearDate')}
        disabled={!value || rest.disabled}
        onClick={() => onChange('')}
      >
        ×
      </button>
    </span>
  );
}
