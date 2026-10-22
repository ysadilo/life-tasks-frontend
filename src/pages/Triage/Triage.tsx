import { useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '../../components/layout';
import { Button, Chip, RichText } from '../../components/ui';
import { MetaChip } from '../../components/task';
import { useSwipe, type SwipeDirection } from '../../hooks/useSwipe';
import { useTriageQueue, type TriageAction, type TriageQueueItem } from '../../hooks/useTriageQueue';
import type { ResolveMissedAction } from '../../hooks/useTasks';
import { daysOverdue } from '../../lib/taskDates';
import { lifeAreaColorVar } from '../../lib/lifeAreas';
import { useLifeAreaLookup } from '../../hooks/useLifeAreas';
import styles from './Triage.module.css';

const ACTION_KEYS: Record<string, TriageAction> = {
  ArrowRight: 'today',
  ArrowLeft: 'backlog',
  ArrowUp: 'done',
  ArrowDown: 'drop',
};

const SWIPE_ACTIONS: Record<SwipeDirection, TriageAction> = {
  right: 'today',
  left: 'backlog',
  up: 'done',
  down: 'drop',
};

const MISSED_ACTION_KEYS: Record<string, ResolveMissedAction> = {
  ArrowRight: 'addToday',
  ArrowUp: 'done',
  ArrowDown: 'dismiss',
};

export default function Triage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { current, upcoming, index, total, act, actMissed, undo, canUndo, history, isLoading, error, done } =
    useTriageQueue();
  const isMissed = current?.kind === 'missed';
  const swipe = useSwipe(
    (direction) => {
      if (!isMissed) return act(SWIPE_ACTIONS[direction]);
      const missedAction =
        MISSED_ACTION_KEYS[{ right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', left: '' }[direction]];
      if (missedAction) actMissed(missedAction);
    },
    isMissed ? ['right', 'up', 'down'] : ['left', 'right', 'up', 'down']
  );

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (current.kind === 'missed') {
        const missedAction = MISSED_ACTION_KEYS[e.key];
        if (missedAction) {
          e.preventDefault();
          actMissed(missedAction);
        }
        return;
      }
      const action = ACTION_KEYS[e.key];
      if (action) {
        e.preventDefault();
        act(action);
      } else if (e.key === 'u' || e.key === 'U') {
        undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, act, actMissed, undo]);

  if (isLoading) return <PageState>{t('triage.loading')}</PageState>;
  if (error) return <PageState>{t('triage.error')}</PageState>;

  const counts: Record<TriageAction, number> = { today: 0, backlog: 0, done: 0, drop: 0 };
  for (const entry of history) counts[entry.action]++;
  const summary = [
    counts.today && t('triage.sortedToday', { count: counts.today }),
    counts.backlog && t('triage.sortedBacklog', { count: counts.backlog }),
    counts.done && t('triage.sortedDone', { count: counts.done }),
    counts.drop && t('triage.sortedDropped', { count: counts.drop }),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.heading}>{t('triage.title')}</h1>
          {!done && <span className={styles.subtitle}>{t('triage.subtitle', { index, total })}</span>}
        </div>
        <div className={styles.progress} aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`${styles.segment} ${i < index - 1 || done ? styles.segmentDone : i === index - 1 ? styles.segmentCurrent : ''}`}
            />
          ))}
        </div>
        <div className={styles.headerActions}>
          {canUndo && (
            <Button variant="ghost" onClick={undo}>
              {t('triage.undo')}
            </Button>
          )}
          <button type="button" className={styles.finishLater} onClick={() => navigate('/today')}>
            {t('triage.finishLater')}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <aside className={styles.side}>
          {history.length > 0 && (
            <>
              <span className={styles.sideLabel}>{t('triage.sorted')}</span>
              {history.slice(-6).map((entry, i) => (
                <div key={`${entry.task.id}-${i}`} className={styles.sideItem}>
                  <span className={styles.sideTitle}>{entry.task.title}</span>
                  <span className={`${styles.sideBadge} ${styles[entry.action]}`}>
                    {t(`triage.short.${entry.action}`)}
                  </span>
                </div>
              ))}
            </>
          )}
        </aside>
        {done || !current ? (
          <div className={styles.complete}>
            <div className={styles.completeIcon}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className={styles.completeCopy}>
              <span className={styles.completeTitle}>{t('triage.emptyTitle')}</span>
              <span className={styles.completeDescription}>
                {t('triage.cardsSorted', { count: total })}
                {summary && `: ${summary}.`}
              </span>
            </div>
            <Button variant="secondary" onClick={() => navigate('/today')}>
              {t('triage.goToToday')}
            </Button>
          </div>
        ) : (
          <div className={styles.stack}>
            <div
              className={`${styles.cards} ${styles[`layers${Math.min(upcoming.length, 2)}` as 'layers1' | 'layers2'] ?? ''}`}
              style={{ '--swipe-progress': swipe.progress } as CSSProperties}
            >
              {upcoming[0] && (
                <div className={`${styles.card} ${styles.cardUnder}`} aria-hidden>
                  <TaskCardBody item={upcoming[0]} />
                </div>
              )}
              <div
                {...swipe.bind}
                style={swipe.style}
                className={`${styles.card} ${styles.cardTop} ${styles[`swipe_${SWIPE_ACTIONS[swipe.direction]}` as 'swipe_today']}`}
              >
                <TaskCardBody item={current} />
              </div>
            </div>

            {isMissed ? (
              <div className={`${styles.actions} ${styles.actionsThree}`}>
                <button type="button" className={`${styles.action} ${styles.done}`} onClick={() => actMissed('done')}>
                  {t('triage.short.done')}
                  <span className={styles.key}>↑</span>
                </button>
                <button
                  type="button"
                  className={`${styles.action} ${styles.today}`}
                  onClick={() => actMissed('addToday')}
                >
                  {t('triage.short.today')}
                  <span className={styles.key}>→</span>
                </button>
                <button
                  type="button"
                  className={`${styles.action} ${styles.drop}`}
                  onClick={() => actMissed('dismiss')}
                >
                  {t('triage.dismissMissed')}
                  <span className={styles.key}>↓</span>
                </button>
              </div>
            ) : (
              <div className={styles.actions}>
                <button type="button" className={`${styles.action} ${styles.today}`} onClick={() => act('today')}>
                  {t('triage.short.today')}
                  <span className={styles.key}>→</span>
                </button>
                <button type="button" className={`${styles.action} ${styles.backlog}`} onClick={() => act('backlog')}>
                  {t('triage.short.backlog')}
                  <span className={styles.key}>←</span>
                </button>
                <button type="button" className={`${styles.action} ${styles.done}`} onClick={() => act('done')}>
                  {t('triage.short.done')}
                  <span className={styles.key}>↑</span>
                </button>
                <button type="button" className={`${styles.action} ${styles.drop}`} onClick={() => act('drop')}>
                  {t('triage.short.drop')}
                  <span className={styles.key}>↓</span>
                </button>
              </div>
            )}

            <span className={styles.hint}>
              {t('triage.hint')}{' '}
              {!isMissed && canUndo && (
                <>
                  <span className={styles.hintKey}>U</span> {t('triage.hintUndo')}
                </>
              )}
            </span>
          </div>
        )}
        <aside className={styles.side}>
          {upcoming.length > 0 && (
            <>
              <span className={styles.sideLabel}>{t('triage.stillToSort')}</span>
              {upcoming.slice(0, 6).map((item) => (
                <div key={`${item.kind}-${item.task.id}`} className={`${styles.sideItem} ${styles.sideItemPending}`}>
                  <span className={styles.sideTitle}>{item.task.title}</span>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function TaskCardBody({ item }: { item: TriageQueueItem }) {
  const { t, i18n } = useTranslation();
  const areas = useLifeAreaLookup();
  const { task } = item;
  const isMissed = item.kind === 'missed';
  const area = task.areaId ? areas.get(task.areaId) : undefined;
  const overdue = isMissed ? 0 : daysOverdue(task);
  const missedDateLabel =
    isMissed && task.missedDates?.[0]
      ? new Date(task.missedDates[0]).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })
      : '';

  return (
    <>
      <div className={styles.badgeRow}>
        {isMissed ? (
          <Chip variant="danger" pill>
            {t('triage.missedBadge', { date: missedDateLabel })}
          </Chip>
        ) : (
          <Chip variant="danger" pill>
            {task.priority ? `${task.priority} · ` : ''}
            {t('triage.overdue', { count: overdue })}
          </Chip>
        )}
        {area && (
          <span className={styles.area}>
            <span className={styles.areaDot} style={{ background: lifeAreaColorVar(area.order) }} />
            {area.name}
          </span>
        )}
      </div>

      <div className={styles.title}>{task.title}</div>
      {task.description && <RichText html={task.description} className={styles.description} />}

      <div className={styles.metaRow}>
        {task.estimatedMinutes != null && <MetaChip axis="effort" minutes={task.estimatedMinutes} />}
        {task.energy && <MetaChip axis="energy" value={task.energy} />}
      </div>
    </>
  );
}
