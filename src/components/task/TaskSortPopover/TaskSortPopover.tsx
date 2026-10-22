import { useTranslation } from 'react-i18next';
import { OptionPopover } from '../OptionPopover';
import { PRIORITY_RANK } from '../../../lib/priority';
import type { Task } from '../../../models';

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
  const options = SORT_OPTIONS.map((value) => ({
    value,
    label: t(`today.sort.${value}`),
    description: t(`today.sort.${value}Description`),
  }));
  return (
    <OptionPopover
      options={options}
      value={sortBy}
      onChange={onChange}
      onClose={onClose}
      ariaLabel={t('today.sort.title')}
    />
  );
}
