import type { ReactNode } from 'react';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { useTranslation } from 'react-i18next';
import { SectionLabel } from '../../ui/SectionLabel';
import { PriorityFlag } from '../MetaChip';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { PRIORITIES } from '../../../lib/priority';
import { ENERGIES } from '../../../lib/taskMeta';
import type { Task } from '../../../models';
import { EMPTY_TASK_FILTERS, activeFilterCount, type TaskFilters } from './taskFilters';
import styles from './FilterPanel.module.css';

const toggle = <T,>(values: T[], value: T) =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

/** The segmented control that heads the panel: Backlog's "Group by", Today's "Sort by". */
export interface PanelOrder<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export interface FilterPanelProps<T extends string> {
  /** The page's tasks, for the per-option counts. */
  tasks: Task[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  order: PanelOrder<T>;
  /** Desktop rail: "Filters · Clear all" heading and the sidebar hint. The phone sheet has its own title and picks areas here. */
  inRail?: boolean;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className={styles.count}>{n}</span>;
}

/** v7 filter panel: group/sort, priority, energy and (on phones) life area, each option with its task count. */
export function FilterPanel<T extends string>({
  tasks,
  filters,
  onChange,
  order,
  inRail = false,
}: FilterPanelProps<T>) {
  const { t } = useTranslation();
  const { data: areas } = useLifeAreas();
  const count = (match: (task: Task) => boolean) => tasks.filter(match).length;

  return (
    <div className={styles.panel} role="region" aria-label={t('filters.title')}>
      {inRail && (
        <div className={styles.heading}>
          <SectionLabel>{t('filters.title')}</SectionLabel>
          <ClearAll onClear={() => onChange(EMPTY_TASK_FILTERS)} />
        </div>
      )}

      <Field label={order.label}>
        <div role="group" aria-label={order.label} className={styles.segmented}>
          {order.options.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={order.value === value}
              className={styles.segment}
              onClick={() => order.onChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('taskForm.priority')}>
        <div className={styles.chips}>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={filters.priorities.includes(p)}
              className={styles.chip}
              onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
            >
              <PriorityFlag priority={p} />
              {p}
              <Count n={count((task) => task.priority === p)} />
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('taskForm.energy')}>
        <div role="group" aria-label={t('taskForm.energy')} className={styles.segmented}>
          {ENERGIES.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={filters.energies.includes(e)}
              className={styles.segment}
              onClick={() => onChange({ ...filters, energies: toggle(filters.energies, e) })}
            >
              {t(`taskForm.energyOption.${e}`)}
              <Count n={count((task) => task.energy === e)} />
            </button>
          ))}
        </div>
      </Field>

      {inRail ? (
        <span className={styles.hint}>{t('filters.areaHint')}</span>
      ) : (
        !!areas?.length && (
          <Field label={t('taskForm.area')}>
            <div className={styles.chips}>
              {areas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={filters.areaIds.includes(a.id)}
                  className={styles.chip}
                  onClick={() => onChange({ ...filters, areaIds: toggle(filters.areaIds, a.id) })}
                >
                  <span className={styles.dot} style={{ background: lifeAreaColorVar(a.order) }} aria-hidden />
                  {a.name}
                  <Count n={count((task) => task.areaId === a.id)} />
                </button>
              ))}
            </div>
          </Field>
        )
      )}
    </div>
  );
}

export function ClearAll({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" className={styles.clearAll} onClick={onClear}>
      {t('filters.clearAll')}
    </button>
  );
}

/** Below 1100px, where the rail is hidden: opens the panel in a sheet. Acid while any filter is on. */
export function FiltersButton({ filters, onClick }: { filters: TaskFilters; onClick: () => void }) {
  const { t } = useTranslation();
  const n = activeFilterCount(filters);
  return (
    <button
      type="button"
      className={styles.filtersButton}
      aria-label={n ? t('filters.titleActive', { count: n }) : t('filters.title')}
      aria-pressed={n > 0}
      onClick={onClick}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M3 6h8M15 6h2M3 14h2M9 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className={styles.filtersLabel}>{t('filters.title')}</span>
      {n > 0 && <span className={styles.filtersCount}>{n}</span>}
    </button>
  );
}

/** Desktop right rail (hidden under 1100px): the filter panel, then the page's own cards. */
export function FilterRail<T extends string>({ children, ...panel }: FilterPanelProps<T> & { children?: ReactNode }) {
  return (
    <aside className={styles.rail}>
      <div className={styles.railFilters}>
        <FilterPanel {...panel} inRail />
      </div>
      {children}
    </aside>
  );
}

interface FilterSheetProps<T extends string> extends FilterPanelProps<T> {
  open: boolean;
  onClose: () => void;
  /** Tasks the current filters let through, for the "Show N tasks" button. */
  matchCount: number;
}

/** Where the rail is hidden: the same panel in a sheet (a bottom sheet on phones), with Clear all and "Show N tasks". */
export function FilterSheet<T extends string>({ open, onClose, matchCount, ...panel }: FilterSheetProps<T>) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('filters.title')}
      className={styles.sheet}
      headerAction={<ClearAll onClear={() => panel.onChange(EMPTY_TASK_FILTERS)} />}
    >
      <FilterPanel {...panel} />
      <Button variant="primary" className={styles.showTasks} onClick={onClose}>
        {t('filters.showTasks', { count: matchCount })}
      </Button>
    </Modal>
  );
}
