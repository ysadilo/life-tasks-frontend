import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { SegmentedTabs, peek } from '../../components/ui';
import { useInsights } from '../../hooks/useInsights';
import { INSIGHT_RANGES, STREAK_MILESTONES, type InsightRange } from '../../lib/insights';
import { tryAppear } from '../../lib/samoyed';
import { AreaBalanceCard } from './cards/AreaBalanceCard';
import { BurnoutCard } from './cards/BurnoutCard';
import { CreatedDoneCard } from './cards/CreatedDoneCard';
import { EffortCard } from './cards/EffortCard';
import { EnergyCard } from './cards/EnergyCard';
import { GapsCard } from './cards/GapsCard';
import { HabitsCard } from './cards/HabitsCard';
import { MatrixCard } from './cards/MatrixCard';
import { PlannedCard } from './cards/PlannedCard';
import { StreakCard } from './cards/StreakCard';
import { VibeCalendarCard } from './cards/VibeCalendarCard';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { t } = useTranslation();
  const [range, setRange] = useState<InsightRange>('month');
  const insights = useInsights(range);
  const current = insights.streak.current;

  const rangeOptions = useMemo(
    () => INSIGHT_RANGES.map((value) => ({ value, label: t(`dashboard.range.${value}`) })),
    [t]
  );

  // Celebrate 7 / 30 / 100-day streaks (Samoyed rules still cap how often it shows).
  useEffect(() => {
    if (STREAK_MILESTONES.includes(current) && tryAppear('streak')) peek.show('streak');
  }, [current]);

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.summary', { closed: insights.closed, checkins: insights.withCheckin, context: range })}
        actions={<SegmentedTabs options={rangeOptions} value={range} onChange={(v) => setRange(v as InsightRange)} />}
      />
      {insights.isLoading ? (
        <PageState>{t('dashboard.loading')}</PageState>
      ) : (
        <div className={styles.grid}>
          <StreakCard streak={insights.streak} />
          <EffortCard effort={insights.effort} range={range} />
          <EnergyCard counts={insights.energy} />
          <AreaBalanceCard shares={insights.shares} />
          <BurnoutCard rows={insights.burnout} />
          <GapsCard gaps={insights.gaps} />
          <MatrixCard matrix={insights.matrix} />
          <HabitsCard habits={insights.habits} />
          <PlannedCard insight={insights.planned} range={range} />
          <CreatedDoneCard rows={insights.createdDone} range={range} />
          <VibeCalendarCard cells={insights.heat} range={range} />
        </div>
      )}
    </div>
  );
}
