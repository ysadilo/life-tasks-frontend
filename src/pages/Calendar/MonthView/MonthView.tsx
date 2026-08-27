import { useTranslation } from 'react-i18next';
import { TaskChip } from '../../../components/task';
import { buildMonthGrid, isSameDay, weekdayLabel } from '../../../lib/dateUtils';
import type { Task } from '../../../models';
import styles from './MonthView.module.css';

interface MonthViewProps {
  anchor: Date;
  tasks: Task[];
}

const VISIBLE_CHIPS_PER_CELL = 3;

export function MonthView({ anchor, tasks }: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const cells = buildMonthGrid(anchor);
  const weekdayLabels = cells.slice(0, 7).map((cell) => weekdayLabel(cell.date, i18n.language));
  const today = new Date();

  return (
    <div className={styles.wrap}>
      <div className={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <span key={index} className={styles.weekdayLabel}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((cell) => {
          const dayTasks = tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), cell.date));
          const visible = dayTasks.slice(0, VISIBLE_CHIPS_PER_CELL);
          const overflow = dayTasks.length - visible.length;
          const isToday = isSameDay(cell.date, today);

          return (
            <div
              key={cell.date.toISOString()}
              className={[styles.cell, !cell.isCurrentMonth ? styles.faded : '', isToday ? styles.today : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.dateNumber}>
                {cell.date.getDate()}
                {isToday ? t('calendar.todaySuffix') : ''}
              </span>
              <div className={styles.chips}>
                {visible.map((task) => (
                  <TaskChip key={task.id} task={task} />
                ))}
                {overflow > 0 && <span className={styles.more}>{t('calendar.more', { count: overflow })}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
