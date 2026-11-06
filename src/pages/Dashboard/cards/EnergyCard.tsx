import { useTranslation } from 'react-i18next';
import type { Energy } from '../../../models';
import { ENERGIES } from '../../../lib/taskMeta';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

const FILL: Record<Energy, string> = {
  low: 'var(--color-success-solid)',
  medium: 'var(--color-focus-ring)',
  high: 'var(--chip-energy-high-border)',
};

export function EnergyCard({ counts }: { counts: Record<Energy, number> }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...ENERGIES.map((e) => counts[e]));
  return (
    <InsightCard infoKey="energy" title={t('dashboard.energy.title')} subtitle={t('dashboard.energy.subtitle')}>
      <div className={styles.list}>
        {ENERGIES.map((energy) => (
          <div key={energy} className={styles.hbarRow}>
            <span className={styles.hbarLabel}>{t(`dashboard.energy.${energy}`)}</span>
            <span className={styles.hbarTrack}>
              <span
                className={styles.hbarFill}
                style={{ width: `${(counts[energy] / max) * 100}%`, background: FILL[energy] }}
              />
            </span>
            <span className={styles.hbarValue}>{counts[energy]}</span>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}
