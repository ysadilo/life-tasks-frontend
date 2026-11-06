import { useMemo } from 'react';
import { useLifeAreas } from './useLifeAreas';
import { useBoardMembers } from './useBoards';
import { useRecurringTasks, useTasksByStatus } from './useTasks';
import {
  areaShares,
  burnoutRows,
  completionsOf,
  createdVsDone,
  effortGaps,
  effortOf,
  energyCounts,
  habitStreaks,
  heatCells,
  inPeriod,
  periodOf,
  plannedVsDone,
  streakOf,
  vibeMatrix,
  type InsightRange,
} from '../lib/insights';
import { useLocalToday } from '../lib/dateUtils';

/** All dashboard numbers for the active board, scoped to the current user, for one Week / Month / Year range. */
export function useInsights(range: InsightRange) {
  const todayISO = useLocalToday();
  const { shared, me } = useBoardMembers();
  const done = useTasksByStatus('done');
  const today = useTasksByStatus('today');
  const backlog = useTasksByStatus('backlog');
  const triage = useTasksByStatus('needs_triage');
  const recurring = useRecurringTasks();
  const areas = useLifeAreas();

  const isLoading = [done, today, backlog, triage, recurring, areas].some((q) => q.isLoading);

  const insights = useMemo(() => {
    const now = new Date(`${todayISO}T12:00:00`);
    // On a shared board only what's assigned to me is mine; on a solo board everything is.
    const mine = <T extends { assigneeId?: string | null }>(items?: T[]) =>
      (items ?? []).filter((t) => !shared || (!!me && t.assigneeId === me.userId));
    const oneOff = [...mine(done.data), ...mine(today.data), ...mine(backlog.data), ...mine(triage.data)];
    const series = mine(recurring.data);

    const period = periodOf(range, now);
    const all = completionsOf([...oneOff, ...series]);
    const inRange = all.filter((c) => inPeriod(c.day, period));

    return {
      closed: inRange.length,
      withCheckin: inRange.filter((c) => c.feeling).length,
      streak: streakOf(all, now),
      effort: effortOf(all, range, now),
      energy: energyCounts(inRange),
      shares: areaShares(inRange),
      burnout: burnoutRows(inRange),
      gaps: effortGaps(inRange),
      matrix: vibeMatrix(inRange),
      habits: habitStreaks(series, now),
      heat: heatCells(all, range, now),
      planned: plannedVsDone([...oneOff, ...series], all, range, now),
      createdDone: createdVsDone(
        oneOff,
        (areas.data ?? []).map((a) => a.id),
        period
      ),
    };
  }, [todayISO, range, shared, me, done.data, today.data, backlog.data, triage.data, recurring.data, areas.data]);

  return { isLoading, ...insights };
}
