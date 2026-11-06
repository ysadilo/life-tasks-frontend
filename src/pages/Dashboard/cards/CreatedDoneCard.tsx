import { useTranslation } from 'react-i18next';
import type { CreatedDoneRow } from '../../../lib/insights';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_RADIUS = 120;
const LABEL_RADIUS = MAX_RADIUS + 14;
const LOW_RATE = 50;

/** Pie wedge from angle a0 to a1 (radians, 0 = 12 o'clock). */
function wedge(r: number, a0: number, a1: number): string {
  const point = (a: number) => `${CENTER + r * Math.sin(a)} ${CENTER - r * Math.cos(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${CENTER} ${CENTER} L${point(a0)} A${r} ${r} 0 ${large} 1 ${point(a1)} Z`;
}

/** Radius ∝ √count, so a wedge's area (not its length) is proportional to the number. */
const radiusOf = (count: number, max: number) => (max ? MAX_RADIUS * Math.sqrt(count / max) : 0);

export function CreatedDoneCard({ rows, range }: { rows: CreatedDoneRow[]; range: string }) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const total = rows.reduce((s, r) => ({ created: s.created + r.created, done: s.done + r.done }), {
    created: 0,
    done: 0,
  });
  const max = Math.max(0, ...rows.map((r) => r.created));
  const step = (2 * Math.PI) / Math.max(rows.length, 1);
  const filling = rows
    .filter((r) => r.created - r.done >= 3 && r.rate < LOW_RATE)
    .sort((a, b) => b.created - b.done - (a.created - a.done))[0];

  return (
    <InsightCard
      infoKey="createdDone"
      title={t('dashboard.createdDone.title')}
      subtitle={t(`dashboard.createdDone.subtitle.${range}`)}
      span={4}
      aside={
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={[styles.swatch, styles.swatchCreated].join(' ')} />
            {t('dashboard.createdDone.created')}
          </span>
          <span className={styles.legendItem}>
            <span className={[styles.swatch, styles.swatchDone].join(' ')} />
            {t('dashboard.createdDone.done')}
          </span>
        </span>
      }
    >
      {total.created === 0 ? (
        <span className={styles.empty}>{t('dashboard.noData')}</span>
      ) : (
        <div className={styles.polarLayout}>
          <svg
            className={styles.polar}
            viewBox={`-30 0 ${SIZE + 60} ${SIZE}`}
            role="img"
            aria-label={t('dashboard.createdDone.title')}
          >
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <circle
                key={f}
                cx={CENTER}
                cy={CENTER}
                r={MAX_RADIUS * f}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeDasharray="2 4"
              />
            ))}
            {rows.map((row, i) => {
              const a0 = i * step;
              const a1 = rows.length === 1 ? a0 + step - 0.0001 : a0 + step - 0.02;
              const color = lifeAreaColorVar(areas.get(row.areaId)?.order ?? 0);
              return (
                <g key={row.areaId}>
                  <path
                    d={wedge(radiusOf(row.created, max), a0, a1)}
                    fill={color}
                    fillOpacity={0.25}
                    stroke={color}
                    strokeDasharray="4 3"
                  />
                  <path d={wedge(radiusOf(row.done, max), a0, a1)} fill={color} />
                </g>
              );
            })}
            {rows.map((row, i) => {
              const mid = i * step + step / 2;
              const sin = Math.sin(mid);
              return (
                <text
                  key={row.areaId}
                  x={CENTER + LABEL_RADIUS * sin}
                  y={CENTER - LABEL_RADIUS * Math.cos(mid) + 4}
                  textAnchor={sin > 0.2 ? 'start' : sin < -0.2 ? 'end' : 'middle'}
                  fontSize={11}
                  fontWeight={500}
                  fill="var(--color-text-secondary)"
                >
                  {areas.get(row.areaId)?.name}
                </text>
              );
            })}
          </svg>
          <div className={styles.table}>
            <div className={[styles.tableRow, styles.tableHead].join(' ')}>
              <span>{t('dashboard.createdDone.area')}</span>
              <span className={styles.num}>{t('dashboard.createdDone.created')}</span>
              <span className={styles.num}>{t('dashboard.createdDone.done')}</span>
              <span className={styles.headSpan}>{t('dashboard.createdDone.rate')}</span>
            </div>
            {rows.map((row) => (
              <div key={row.areaId} className={styles.tableRow}>
                <span className={styles.areaName}>
                  <span
                    className={styles.dot}
                    style={{ background: lifeAreaColorVar(areas.get(row.areaId)?.order ?? 0) }}
                  />
                  {areas.get(row.areaId)?.name}
                </span>
                <span className={styles.num}>{row.created}</span>
                <span className={styles.num}>{row.done}</span>
                <span className={styles.rateTrack}>
                  <span
                    className={styles.rateFill}
                    style={{ width: `${row.rate}%`, background: lifeAreaColorVar(areas.get(row.areaId)?.order ?? 0) }}
                  />
                </span>
                <span className={[styles.num, row.created && row.rate < LOW_RATE ? styles.rateLow : ''].join(' ')}>
                  {row.rate}%
                </span>
              </div>
            ))}
            <div className={[styles.tableRow, styles.tableTotal].join(' ')}>
              <span>{t('dashboard.createdDone.total')}</span>
              <span className={styles.num}>{total.created}</span>
              <span className={styles.num}>{total.done}</span>
              <span />
              <span className={styles.num}>{Math.round((total.done / total.created) * 100)}%</span>
            </div>
            {filling && (
              <span className={styles.tip}>
                {t('dashboard.createdDone.tip', {
                  area: areas.get(filling.areaId)?.name,
                  created: filling.created,
                  done: filling.done,
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </InsightCard>
  );
}
