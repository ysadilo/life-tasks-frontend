import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { AreaShare } from '../../../lib/insights';
import { lifeAreaColorVar } from '../../../lib/lifeAreas';
import { useLifeAreaLookup } from '../../../hooks/useLifeAreas';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

export function AreaBalanceCard({ shares }: { shares: AreaShare[] }) {
  const { t } = useTranslation();
  const areas = useLifeAreaLookup();
  const rows = shares.filter((s) => areas.has(s.areaId));
  const datum = Object.fromEntries(rows.map((s) => [s.areaId, s.percent]));
  return (
    <InsightCard
      infoKey="balance"
      title={t('dashboard.balance.title')}
      subtitle={t('dashboard.balance.subtitle')}
      span={2}
    >
      {rows.length === 0 ? (
        <span className={styles.empty}>{t('dashboard.noData')}</span>
      ) : (
        <>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={26}>
              <BarChart
                accessibilityLayer={false}
                data={[datum]}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" hide />
                {rows.map((s) => (
                  <Bar
                    key={s.areaId}
                    dataKey={s.areaId}
                    stackId="a"
                    fill={lifeAreaColorVar(areas.get(s.areaId)?.order ?? 0)}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legend}>
            {rows.map((s) => (
              <span key={s.areaId} className={styles.legendItem}>
                <span
                  className={styles.dot}
                  style={{ background: lifeAreaColorVar(areas.get(s.areaId)?.order ?? 0) }}
                />
                {areas.get(s.areaId)?.name} {s.percent}%
              </span>
            ))}
          </div>
        </>
      )}
    </InsightCard>
  );
}
