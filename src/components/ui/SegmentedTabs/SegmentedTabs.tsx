import styles from './SegmentedTabs.module.css';

export interface SegmentedTabOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  return (
    <div className={styles.track}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[styles.tab, option.value === value ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
