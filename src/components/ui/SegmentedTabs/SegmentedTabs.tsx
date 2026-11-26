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
  /** `plain`: v7 text tabs with no track, the active one on a grey pill (shared Today's Mine / Everyone / Unassigned). */
  variant?: 'track' | 'plain';
}

export function SegmentedTabs({ options, value, onChange, size = 'md', variant = 'track' }: SegmentedTabsProps) {
  return (
    <div
      className={[styles.track, size === 'sm' && styles.small, variant === 'plain' && styles.plain]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={[styles.tab, option.value === value ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
