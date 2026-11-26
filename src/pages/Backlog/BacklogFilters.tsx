import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_TASK_FILTERS, PriorityFlag, type TaskFilters } from '../../components/task';
import { useLifeAreas } from '../../hooks/useLifeAreas';
import { lifeAreaColorVar } from '../../lib/lifeAreas';
import { PRIORITIES } from '../../lib/priority';
import { ENERGIES } from '../../lib/taskMeta';
import { weekBucket, type GroupBy } from '../../lib/taskGrouping';
import type { Task } from '../../models';
import styles from './BacklogFilters.module.css';

const GROUP_BY: GroupBy[] = ['date', 'area'];

const toggle = <T,>(values: T[], value: T) =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

interface BacklogFiltersProps {
  /** Every backlog task, for the per-option counts. */
  tasks: Task[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  groupBy: GroupBy;
  onGroupBy: (groupBy: GroupBy) => void;
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

/** v7 Backlog filters: group by, priority, energy and (on phones) life area, each option with its task count. */
export function BacklogFilters({ tasks, filters, onChange, groupBy, onGroupBy, inRail = false }: BacklogFiltersProps) {
  const { t } = useTranslation();
  const { data: areas } = useLifeAreas();
  const count = (match: (task: Task) => boolean) => tasks.filter(match).length;

  return (
    <div className={styles.panel} role="region" aria-label={t('backlog.filters')}>
      {inRail && (
        <div className={styles.heading}>
          <span className={styles.headingLabel}>{t('backlog.filters')}</span>
          <ClearAll onClear={() => onChange(EMPTY_TASK_FILTERS)} />
        </div>
      )}

      <Field label={t('backlog.groupBy')}>
        <div role="group" aria-label={t('backlog.groupBy')} className={styles.segmented}>
          {GROUP_BY.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={groupBy === value}
              className={styles.segment}
              onClick={() => onGroupBy(value)}
            >
              {t(`backlog.group.${value}`)}
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
        <span className={styles.hint}>{t('backlog.areaHint')}</span>
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
      {t('today.clearAll')}
    </button>
  );
}

const PLANNED_WEEKS = ['thisWeek', 'nextWeek', 'later'] as const;

/** Rail card: how many backlog tasks are planned for this week, next week and later, as bars. */
export function PlannedPerWeek({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();
  const rows = PLANNED_WEEKS.map((key) => ({ key, count: tasks.filter((task) => weekBucket(task) === key).length }));
  const max = Math.max(...rows.map((row) => row.count));
  if (max === 0) return null;

  return (
    <section className={styles.planned}>
      <span className={styles.headingLabel}>{t('backlog.plannedPerWeek')}</span>
      {rows.map(({ key, count }) => (
        <div key={key} className={styles.week}>
          <div className={styles.weekLine}>
            <span>{t(`backlog.group.${key}`)}</span>
            <Count n={count} />
          </div>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}
