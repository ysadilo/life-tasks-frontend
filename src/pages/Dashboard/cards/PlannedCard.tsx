import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { InsightRange, PlannedInsight, PlannedSlice } from '../../../lib/insights';
import { formatMonthTitle, formatWeekRangeTitle } from '../../../lib/dateUtils';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

const PLANNED = 'var(--color-info-border)';
const DONE = 'var(--insight-done)';

function sliceLabel(range: InsightRange, slice: PlannedSlice, locale: string): string {
  switch (range) {
    case 'week':
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(slice.from);
    case 'month':
      return String(slice.from.getDate());
    case 'year':
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(slice.from);
  }
}

function periodLabel(range: InsightRange, from: Date, locale: string): string {
  switch (range) {
    case 'week':
      return formatWeekRangeTitle(from, locale);
    case 'month':
      return formatMonthTitle(from, locale);
    case 'year':
      return String(from.getFullYear());
  }
}

export function PlannedCard({ insight, range }: { insight: PlannedInsight; range: InsightRange }) {
  const { t, i18n } = useTranslation();
  const { slices, gap } = insight;
  const data = slices.map((s) => ({
    label: sliceLabel(range, s, i18n.language),
    planned: s.planned,
    done: s.done,
    isCurrent: s.isCurrent,
    future: s.future,
  }));
  const todayLabel = data.find((d) => d.isCurrent)?.label;
  const empty = slices.every((s) => s.planned === 0 && s.done === 0);
  const stat = (value: string | number, label: string, swatch?: string) => (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>
        {swatch && <span className={[styles.swatch, swatch].join(' ')} />}
        {label}
      </span>
    </div>
  );

  return (
    <InsightCard
      infoKey="planned"
      title={t('dashboard.planned.title')}
      subtitle={t('dashboard.planned.subtitle', { period: periodLabel(range, slices[0].from, i18n.language) })}
      span={4}
      aside={
        <div className={styles.stats}>
          {stat(insight.planned, t('dashboard.planned.planned'), styles.swatchPlanned)}
          {stat(insight.done, t('dashboard.planned.done'), styles.swatchDoneGreen)}
          {stat(insight.hitRate === null ? '–' : `${insight.hitRate}%`, t('dashboard.planned.hitRate'))}
          {stat(insight.ahead, t('dashboard.planned.ahead'), styles.swatchAhead)}
        </div>
      }
    >
      {empty ? (
        <span className={styles.empty}>{t('dashboard.planned.empty')}</span>
      ) : (
        <>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                accessibilityLayer={false}
                data={data}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                barGap={2}
                barCategoryGap="20%"
              >
                <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
                {todayLabel && (
                  <ReferenceArea
                    x1={todayLabel}
                    x2={todayLabel}
                    fill="var(--color-accent-light-bg)"
                    fillOpacity={0.7}
                  />
                )}
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={({ x, y, payload }: { x: number | string; y: number | string; payload: { value: string } }) => (
                    <text
                      x={Number(x)}
                      y={Number(y) + 10}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={payload.value === todayLabel ? 700 : 500}
                      fill={payload.value === todayLabel ? 'var(--color-text)' : 'var(--color-text-faint)'}
                    >
                      {payload.value}
                    </text>
                  )}
                />
                <YAxis
                  width={24}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }}
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
                <Bar
                  dataKey="planned"
                  name={t('dashboard.planned.planned')}
                  radius={[3, 3, 1, 1]}
                  isAnimationActive={false}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.future ? 'transparent' : PLANNED}
                      stroke={d.future ? PLANNED : 'none'}
                      strokeWidth={1.5}
                      strokeDasharray={d.future ? '3 3' : undefined}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="done"
                  name={t('dashboard.planned.done')}
                  fill={DONE}
                  radius={[3, 3, 1, 1]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(gap || insight.today?.busiest) && (
            <span className={styles.tip}>
              {gap &&
                t('dashboard.planned.tip', {
                  weekday: new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(
                    new Date(2026, 7, 2 + gap.weekday)
                  ),
                  planned: gap.planned,
                  done: gap.done,
                })}
              {insight.today?.busiest && ` ${t(`dashboard.planned.tipToday.${range}`, { n: insight.today.planned })}`}
            </span>
          )}
        </>
      )}
    </InsightCard>
  );
}
