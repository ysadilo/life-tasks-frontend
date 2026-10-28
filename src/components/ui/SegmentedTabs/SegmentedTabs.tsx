import styles from './SegmentedTabs.module.css';

export interface SegmentedTabOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  /** `sm` is the compact control used inside list rows. */
  size?: 'md' | 'sm';
}

export function SegmentedTabs({ options, value, onChange, size = 'md' }: SegmentedTabsProps) {
  return (
    <div className={[styles.track, size === 'sm' ? styles.small : ''].filter(Boolean).join(' ')}>
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
