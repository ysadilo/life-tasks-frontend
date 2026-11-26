import { useTranslation } from 'react-i18next';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { ENERGIES, energyRampKey, priorityRampKey } from '../../../lib/taskMeta';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { PRIORITIES } from '../../../lib/priority';
import type { Priority } from '../../../models';
import { PriorityFlag } from '../MetaChip';
import { activeFilterCount, EMPTY_TASK_FILTERS, type TaskFilters } from '../FilterPanel';
import ramp from '../chipRamp.module.css';
import styles from './AppliedFilters.module.css';

interface AppliedFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  /** v7 Backlog look: this text (e.g. "4 of 11 tasks") leads the row, chips are acid with a priority flag, no Clear link. */
  summary?: string;
}

const without = <T,>(values: T[], value: T) => values.filter((v) => v !== value);

/** "Showing" row of removable chips, one per applied filter value, plus a Clear link. */
export function AppliedFilters({ filters, onChange, summary }: AppliedFiltersProps) {
  const { t } = useTranslation();
  const { data: areas } = useLifeAreas();

  if (activeFilterCount(filters) === 0) return null;

  const chips: {
    key: string;
    label: string;
    priority?: Priority;
    rampKey?: string;
    dot?: string;
    onRemove: () => void;
  }[] = [
    ...PRIORITIES.filter((p) => filters.priorities.includes(p)).map((p) => ({
      key: p,
      label: p,
      priority: p,
      rampKey: priorityRampKey(p),
      onRemove: () => onChange({ ...filters, priorities: without(filters.priorities, p) }),
    })),
    ...ENERGIES.filter((e) => filters.energies.includes(e)).map((e) => ({
      key: e,
      label: t(`taskForm.energyOption.${e}`),
      rampKey: energyRampKey(e),
      onRemove: () => onChange({ ...filters, energies: without(filters.energies, e) }),
    })),
    ...(areas ?? [])
      .filter((a) => filters.areaIds.includes(a.id))
      .map((a) => ({
        key: a.id,
        label: a.name,
        dot: lifeAreaColorVar(a.order),
        onRemove: () => onChange({ ...filters, areaIds: without(filters.areaIds, a.id) }),
      })),
  ];

  return (
    <div className={styles.row}>
      <span className={summary ? styles.summary : styles.label}>{summary ?? t('filters.showing')}</span>
      {chips.map(({ key, label, priority, rampKey, dot, onRemove }) => (
        <span
          key={key}
          className={[styles.chip, summary ? styles.acid : rampKey ? ramp[rampKey] : styles.neutral].join(' ')}
        >
          {summary && priority && <PriorityFlag priority={priority} />}
          {dot && <span className={styles.dot} style={{ background: dot }} />}
          {label}
          <button
            type="button"
            className={styles.remove}
            aria-label={t('filters.remove', { label })}
            onClick={onRemove}
          >
            ×
          </button>
        </span>
      ))}
      {!summary && (
        <button type="button" className={styles.clear} onClick={() => onChange(EMPTY_TASK_FILTERS)}>
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}
