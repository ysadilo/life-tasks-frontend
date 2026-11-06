import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { MATRIX_COLUMNS, type VibeMatrix } from '../../../lib/insights';
import { ENERGIES } from '../../../lib/taskMeta';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

export function MatrixCard({ matrix }: { matrix: VibeMatrix }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...ENERGIES.flatMap((e) => MATRIX_COLUMNS.map((c) => matrix[e][c])));
  return (
    <InsightCard infoKey="matrix" title={t('dashboard.matrix.title')} subtitle={t('dashboard.matrix.subtitle')}>
      <div className={styles.matrix}>
        <span />
        {MATRIX_COLUMNS.map((c) => (
          <span key={c}>{t(`dashboard.matrix.${c}`)}</span>
        ))}
        {ENERGIES.map((energy) => (
          <MatrixRow
            key={energy}
            label={t(`dashboard.matrix.row.${energy}`)}
            values={MATRIX_COLUMNS.map((c) => matrix[energy][c])}
            max={max}
          />
        ))}
      </div>
    </InsightCard>
  );
}

/** Share of the busiest cell → fill: none, a warm beige for a few, then deepening green. */
function cellStyle(value: number, max: number): { className?: string; style?: CSSProperties } {
  const ratio = value / max;
  if (value === 0) return {};
  if (ratio < 0.25) return { className: styles.heatMatrixLow };
  const mix = ratio >= 0.8 ? 100 : ratio >= 0.5 ? 70 : 40;
  return {
    style: {
      background: `color-mix(in srgb, var(--color-success-solid) ${mix}%, var(--color-surface))`,
      color: 'var(--color-success-text)',
    },
  };
}

function MatrixRow({ label, values, max }: { label: string; values: number[]; max: number }) {
  return (
    <>
      <span className={styles.matrixRowLabel}>{label}</span>
      {values.map((value, i) => {
        const { className, style } = cellStyle(value, max);
        return (
          <span key={i} className={[styles.matrixCell, className ?? ''].join(' ')} style={style}>
            {value}
          </span>
        );
      })}
    </>
  );
}
