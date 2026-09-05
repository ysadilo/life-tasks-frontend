import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { OptionGroup } from '../OptionGroup';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { PRIORITIES } from '../../../lib/priority';
import { ENERGIES, energyRampKey, priorityRampKey } from '../../../lib/taskMeta';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import type { Energy, LifeAreaId, Priority, Task } from '../../../models';
import styles from './TaskFilterPopover.module.css';

export interface TaskFilters {
  priorities: Priority[];
  energies: Energy[];
  areaIds: LifeAreaId[];
}

export const EMPTY_TASK_FILTERS: TaskFilters = { priorities: [], energies: [], areaIds: [] };

export function activeFilterCount(filters: TaskFilters): number {
  return filters.priorities.length + filters.energies.length + filters.areaIds.length;
}

export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  return (
    (filters.priorities.length === 0 || (!!task.priority && filters.priorities.includes(task.priority))) &&
    (filters.energies.length === 0 || (!!task.energy && filters.energies.includes(task.energy))) &&
    (filters.areaIds.length === 0 || (!!task.areaId && filters.areaIds.includes(task.areaId)))
  );
}

interface TaskFilterPopoverProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  matchCount: number;
  onClose: () => void;
}

export function TaskFilterPopover({ filters, onChange, matchCount, onClose }: TaskFilterPopoverProps) {
  const { t } = useTranslation();
  const { data: areas } = useLifeAreas();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={styles.popover}>
      <OptionGroup
        multiple
        label={t('taskForm.priority')}
        value={filters.priorities}
        onChange={(priorities) => onChange({ ...filters, priorities: priorities as Priority[] })}
        options={PRIORITIES.map((p) => ({ value: p, label: p, rampKey: priorityRampKey(p) }))}
      />
      <OptionGroup
        multiple
        label={t('taskForm.energy')}
        value={filters.energies}
        onChange={(energies) => onChange({ ...filters, energies: energies as Energy[] })}
        options={ENERGIES.map((e) => ({
          value: e,
          label: t(`taskForm.energyOption.${e}`),
          rampKey: energyRampKey(e),
        }))}
      />
      {!!areas?.length && (
        <OptionGroup
          multiple
          label={t('taskForm.area')}
          value={filters.areaIds}
          onChange={(areaIds) => onChange({ ...filters, areaIds })}
          options={areas.map((a) => ({ value: a.id, label: a.name, dot: lifeAreaColorVar(a.order) }))}
        />
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.clearAll} onClick={() => onChange(EMPTY_TASK_FILTERS)}>
          {t('today.clearAll')}
        </button>
        <Button variant="primary" onClick={onClose}>
          {t('today.showTasks', { count: matchCount })}
        </Button>
      </div>
    </div>
  );
}
