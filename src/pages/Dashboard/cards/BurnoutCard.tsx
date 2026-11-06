import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { BurnoutRow } from '../../../lib/insights';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

const ROW_HEIGHT = 26;

export function BurnoutCard({ rows }: { rows: BurnoutRow[] }) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const data = rows.map((r) => ({ ...r, name: areas.get(r.areaId)?.name ?? '' }));
  const worst = data[0];
  return (
    <InsightCard
      infoKey="burnout"
      title={t('dashboard.burnout.title')}
      subtitle={t('dashboard.burnout.subtitle')}
      span={2}
    >
      {data.length === 0 ? (
        <span className={styles.empty}>{t('dashboard.burnout.empty')}</span>
      ) : (
        <>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={data.length * ROW_HEIGHT + 8}>
              <BarChart
                accessibilityLayer={false}
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                barSize={16}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={64}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                />
                <Bar dataKey="rose" stackId="a" fill="var(--insight-rose)" isAnimationActive={false} />
                <Bar dataKey="neutral" stackId="a" fill="var(--color-border-subtle)" isAnimationActive={false} />
                <Bar dataKey="good" stackId="a" fill="var(--color-success-solid)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {worst.rose > 0 && <span className={styles.tip}>{t('dashboard.burnout.tip', { area: worst.name })}</span>}
        </>
      )}
    </InsightCard>
  );
}
