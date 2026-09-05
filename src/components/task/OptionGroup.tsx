import ramp from './chipRamp.module.css';
import styles from './OptionGroup.module.css';

export interface Option {
  value: string;
  label: string;
  /** chipRamp.module.css class key; applied only when the option is selected. */
  rampKey?: string;
  /** Swatch colour (e.g. a life-area CSS var) shown before the label. */
  dot?: string;
}

interface BaseProps {
  label: string;
  options: Option[];
  stretch?: boolean;
}

type OptionGroupProps =
  | (BaseProps & { multiple?: false; value: string; onChange: (value: string) => void })
  | (BaseProps & { multiple: true; value: string[]; onChange: (value: string[]) => void });

/** Row of toggle-chip buttons; single-select clears on re-click, multi-select toggles membership. */
export function OptionGroup(props: OptionGroupProps) {
  const { label, options, stretch = false } = props;

  const isSelected = (value: string) => (props.multiple ? props.value.includes(value) : props.value === value);

  const toggle = (value: string) => {
    if (props.multiple) {
      const next = props.value.includes(value) ? props.value.filter((v) => v !== value) : [...props.value, value];
      props.onChange(next);
    } else {
      props.onChange(props.value === value ? '' : value);
    }
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.options}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          // Options without a rampKey (e.g. life areas) get a generic accent look inline,
          // so it can't lose the CSS cascade to the ramp classes' colours.
          const fallbackStyle =
            selected && !option.rampKey
              ? {
                  background: 'var(--color-accent-light-bg)',
                  borderColor: option.dot ?? 'var(--color-accent-light-border)',
                  color: 'var(--color-accent-light-text)',
                }
              : undefined;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={[
                styles.option,
                stretch ? styles.optionStretch : '',
                selected ? styles.optionSelected : '',
                selected && option.rampKey ? ramp[option.rampKey] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={fallbackStyle}
              onClick={() => toggle(option.value)}
            >
              {option.dot && <span className={styles.dot} style={{ background: option.dot }} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
