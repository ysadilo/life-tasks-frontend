import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={[styles.checkbox, checked ? styles.checked : ''].filter(Boolean).join(' ')}
    />
  );
}
