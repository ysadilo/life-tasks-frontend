import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { useAnchoredPopoverPosition } from '../../../hooks/useAnchoredPopoverPosition';
import { PRIORITY_RANK } from '../../../lib/priority';
import type { Task } from '../../../models';
import styles from './TaskSortPopover.module.css';

export type SortBy = 'priority' | 'dueDate' | 'effort' | 'manual';

export const SORT_OPTIONS: SortBy[] = ['priority', 'dueDate', 'effort', 'manual'];

/** Comparator per sort mode; `manual` keeps the fetched order. */
export const SORT_COMPARATORS: Record<SortBy, ((a: Task, b: Task) => number) | null> = {
  priority: (a, b) => (a.priority ? PRIORITY_RANK[a.priority] : 99) - (b.priority ? PRIORITY_RANK[b.priority] : 99),
  dueDate: (a, b) => (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity),
  effort: (a, b) => (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity),
  manual: null,
};

interface TaskSortPopoverProps {
  sortBy: SortBy;
  onChange: (sortBy: SortBy) => void;
  onClose: () => void;
}

export function TaskSortPopover({ sortBy, onChange, onClose }: TaskSortPopoverProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const position = useAnchoredPopoverPosition(ref);

  return (
    <div
      ref={ref}
      className={styles.popover}
      style={position ?? undefined}
      role="radiogroup"
      aria-label={t('today.sort.title')}
    >
      {SORT_OPTIONS.map((option) => {
        const selected = option === sortBy;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[styles.option, selected ? styles.optionSelected : ''].filter(Boolean).join(' ')}
            onClick={() => {
              onChange(option);
              onClose();
            }}
          >
            <span className={[styles.radio, selected ? styles.radioSelected : ''].filter(Boolean).join(' ')} />
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>{t(`today.sort.${option}`)}</span>
              <span className={styles.optionDescription}>{t(`today.sort.${option}Description`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
