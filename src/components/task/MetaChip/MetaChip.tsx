import { useTranslation } from 'react-i18next';
import { energyRampKey, effortRampKey, formatMinutes, priorityRampKey } from '../../../lib/taskMeta';
import type { Energy, Priority } from '../../../models';
import ramp from '../chipRamp.module.css';
import styles from './MetaChip.module.css';

type MetaChipProps = (
  { axis: 'priority'; value: Priority } | { axis: 'energy'; value: Energy } | { axis: 'effort'; minutes: number }
) & {
  /** Row metadata: text with a flag / clock glyph instead of a tinted chip (v7 task rows). */
  plain?: boolean;
};

function priorityFlagColor(priority: Priority): string {
  switch (priority) {
    case 'P1':
      return 'var(--color-priority-high)';
    case 'P2':
      return 'var(--color-priority-medium)';
    case 'P3':
      return 'var(--color-priority-low)';
    case 'P4':
      return 'var(--color-priority-none)';
  }
}

function FlagIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden className={styles.icon}>
      <path
        d="M1.5 11.5V1.2M1.5 1.5h7.2l-1.6 2.6 1.6 2.6H1.5"
        fill={color}
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={styles.icon}>
      <circle cx="6" cy="6" r="4.9" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3.4V6l1.8 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** The coloured priority flag on its own, e.g. inside a filter chip. */
export function PriorityFlag({ priority }: { priority: Priority }) {
  return <FlagIcon color={priorityFlagColor(priority)} />;
}

/** Small task-meta chip coloured by the priority / energy / effort ramp. */
export function MetaChip(props: MetaChipProps) {
  const { t } = useTranslation();

  let rampKey: string;
  let label: string;
  let icon = null;
  switch (props.axis) {
    case 'priority':
      rampKey = priorityRampKey(props.value);
      label = props.value;
      icon = <FlagIcon color={priorityFlagColor(props.value)} />;
      break;
    case 'energy':
      rampKey = energyRampKey(props.value);
      label = t(`task.energyLabel.${props.value}`);
      break;
    case 'effort':
      rampKey = effortRampKey(props.minutes);
      label = formatMinutes(props.minutes);
      icon = <ClockIcon />;
      break;
  }

  // v7 rows show priority as a bare flag; the label stays for screen readers and on hover.
  if (props.plain && props.axis === 'priority') {
    return (
      <span className={styles.plain} role="img" aria-label={label} title={label}>
        {icon}
      </span>
    );
  }
  if (props.plain) {
    return (
      <span className={styles.plain}>
        {icon}
        {label}
      </span>
    );
  }
  return <span className={[styles.chip, ramp[rampKey]].join(' ')}>{label}</span>;
}
