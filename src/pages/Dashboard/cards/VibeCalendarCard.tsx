import { useTranslation } from 'react-i18next';
import { heatLevel, type HeatCell, type InsightRange } from '../../../lib/insights';
import { startOfWeek, addDays } from '../../../lib/dateUtils';
import { InsightCard } from './InsightCard';
import styles from '../Dashboard.module.css';

const LEVELS = [styles.heat1, styles.heat2, styles.heat3, styles.heat4];

function cellClass(cell: HeatCell, compact: boolean): string {
  const level = heatLevel(cell.score);
  return [
    styles.heatCell,
    level ? LEVELS[level - 1] : '',
    cell.inRange ? '' : styles.heatOut,
    cell.future ? styles.heatFuture : '',
    cell.today ? styles.heatToday : '',
    cell.today && compact ? styles.heatDayToday : '',
  ].join(' ');
}

export function VibeCalendarCard({ cells, range }: { cells: HeatCell[]; range: InsightRange }) {
  const { t, i18n } = useTranslation();
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(addDays(startOfWeek(new Date()), i))
  );
  const year = range === 'year';
  return (
    <InsightCard
      infoKey="calendar"
      title={t('dashboard.calendar.title')}
      subtitle={t(`dashboard.calendar.subtitle.${range}`)}
      span={4}
      aside={
        <span className={styles.heatScale}>
          {t('dashboard.calendar.low')}
          {[0, ...LEVELS].map((c, i) => (
            <span key={i} className={[styles.heatCell, i ? c : ''].join(' ')} />
          ))}
          {t('dashboard.calendar.high')}
        </span>
      }
    >
      <div className={[styles.heat, year ? styles.heatYear : styles.heatCompact].join(' ')}>
        {!year && weekdays.map((d) => <span key={d}>{d}</span>)}
        {cells.map((cell) => (
          <span
            key={cell.day.getTime()}
            className={cellClass(cell, !year)}
            title={cell.score === null ? undefined : `${cell.day.toLocaleDateString()} · ${cell.score.toFixed(1)}`}
          >
            {!year && cell.inRange && cell.day.getDate()}
          </span>
        ))}
      </div>
    </InsightCard>
  );
}
