import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { EffortGap } from '../../../lib/insights';
import { formatMinutes } from '../../../lib/taskMeta';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

export function GapsCard({ gaps }: { gaps: EffortGap[] }) {
  const { t } = useTranslation();
  return (
    <InsightCard infoKey="gaps" title={t('dashboard.gaps.title')} subtitle={t('dashboard.gaps.subtitle')} span={2}>
      {gaps.length === 0 ? (
        <span className={styles.empty}>{t('dashboard.gaps.empty')}</span>
      ) : (
        <div className={styles.list}>
          {gaps.map((gap) => (
            <div key={gap.id}>
              <div className={styles.habit} style={{ justifyContent: 'space-between' }}>
                <span>{gap.title}</span>
                <span className={gap.over ? styles.rateLow : undefined}>
                  {t(gap.over ? 'dashboard.gaps.over' : 'dashboard.gaps.under')} · {formatMinutes(gap.planned)} →{' '}
                  {formatMinutes(gap.actual)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={34}>
                <BarChart
                  accessibilityLayer={false}
                  data={[{ planned: gap.planned, actual: gap.actual }]}
                  layout="vertical"
                  margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
                  barSize={7}
                  barGap={2}
                >
                  <XAxis type="number" hide domain={[0, Math.max(gap.planned, gap.actual)]} />
                  <YAxis type="category" hide />
                  <Bar dataKey="planned" fill="var(--color-info-border)" radius={4} isAnimationActive={false} />
                  <Bar dataKey="actual" radius={4} isAnimationActive={false}>
                    <Cell fill={gap.over ? 'var(--insight-rose)' : 'var(--color-success-solid)'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  );
}
