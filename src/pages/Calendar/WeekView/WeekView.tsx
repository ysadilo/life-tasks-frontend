import { useTranslation } from 'react-i18next';
import { TaskChip } from '../../../components/task';
import { addDays, isSameDay, startOfWeek, weekdayLabel } from '../../../lib/dateUtils';
import type { Task } from '../../../models';
import styles from './WeekView.module.css';

interface WeekViewProps {
  anchor: Date;
  tasks: Task[];
}

export function WeekView({ anchor, tasks }: WeekViewProps) {
  const { t, i18n } = useTranslation();
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const dayTasks = tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day));
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            key={day.toISOString()}
            className={[styles.column, isWeekend ? styles.weekend : ''].filter(Boolean).join(' ')}
          >
            <div className={[styles.dayHeader, isToday ? styles.today : ''].filter(Boolean).join(' ')}>
              <span className={styles.weekday}>{weekdayLabel(day, i18n.language)}</span>
              <span className={styles.dateNumber}>{day.getDate()}</span>
            </div>
            <div className={styles.chips}>
              {dayTasks.map((task) => (
                <TaskChip key={task.id} task={task} />
              ))}
              {dayTasks.length === 0 && <div className={styles.addPlaceholder}>{t('calendar.addPlaceholder')}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
