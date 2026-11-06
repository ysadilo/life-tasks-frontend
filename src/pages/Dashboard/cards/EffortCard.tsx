import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { EffortBucket, EffortInsight, InsightRange } from '../../../lib/insights';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

function bucketLabel(range: InsightRange, b: EffortBucket, locale: string): string {
  switch (range) {
    case 'week':
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(b.from);
    case 'month':
      return `${b.from.getDate()}–${b.to.getDate()}`;
    case 'year':
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(b.from);
  }
}

export function EffortCard({ effort, range }: { effort: EffortInsight; range: InsightRange }) {
  const { t, i18n } = useTranslation();
  const data = effort.buckets.map((b) => ({
    label: bucketLabel(range, b, i18n.language),
    points: b.points,
    isCurrent: b.isCurrent,
  }));
  const diff = effort.aboveMedian;
  return (
    <InsightCard
      infoKey="effort"
      title={t('dashboard.effort.title')}
      subtitle={t(`dashboard.effort.subtitle.${range}`)}
      span={2}
    >
      <div className={styles.big}>
        <span className={styles.bigNumberSm}>{effort.total}</span>
        {t('dashboard.effort.points')}
        {diff !== null &&
          ` · ${t(diff >= 0 ? 'dashboard.effort.above' : 'dashboard.effort.below', { n: Math.abs(diff) })}`}
      </div>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
                fontSize: 12,
              }}
              itemStyle={{ color: 'var(--color-text)' }}
              labelStyle={{ color: 'var(--color-text-secondary)' }}
            />
            <Bar dataKey="points" radius={[7, 7, 3, 3]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isCurrent ? 'var(--color-focus-ring)' : 'var(--color-info-border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </InsightCard>
  );
}
