import { useTranslation } from 'react-i18next';
import { energyRampKey, effortRampKey, formatMinutes, priorityRampKey } from '../../../lib/taskMeta';
import type { Energy, Priority } from '../../../models';
import ramp from '../chipRamp.module.css';
import styles from './MetaChip.module.css';

type MetaChipProps =
  { axis: 'priority'; value: Priority } | { axis: 'energy'; value: Energy } | { axis: 'effort'; minutes: number };

/** Small task-meta chip coloured by the priority / energy / effort ramp. */
export function MetaChip(props: MetaChipProps) {
  const { t } = useTranslation();

  let rampKey: string;
  let label: string;
  if (props.axis === 'priority') {
    rampKey = priorityRampKey(props.value);
    label = props.value;
  } else if (props.axis === 'energy') {
    rampKey = energyRampKey(props.value);
    label = t(`taskForm.energyOption.${props.value}`);
  } else {
    rampKey = effortRampKey(props.minutes);
    label = formatMinutes(props.minutes);
  }

  return <span className={[styles.chip, ramp[rampKey]].join(' ')}>{label}</span>;
}
