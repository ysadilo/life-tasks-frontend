import { useRef } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { useAnchoredPopoverPosition } from '../../../hooks/useAnchoredPopoverPosition';
import styles from './OptionPopover.module.css';

export interface PopoverOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface OptionPopoverProps<T extends string> {
  options: PopoverOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onClose: () => void;
  ariaLabel: string;
}

/** Single-choice radio list in an anchored popover (sort, group-by). */
export function OptionPopover<T extends string>({
  options,
  value,
  onChange,
  onClose,
  ariaLabel,
}: OptionPopoverProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const position = useAnchoredPopoverPosition(ref);

  return (
    <div ref={ref} className={styles.popover} style={position ?? undefined} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[styles.option, selected ? styles.optionSelected : ''].filter(Boolean).join(' ')}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
          >
            <span className={[styles.radio, selected ? styles.radioSelected : ''].filter(Boolean).join(' ')} />
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>{option.label}</span>
              <span className={styles.optionDescription}>{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
