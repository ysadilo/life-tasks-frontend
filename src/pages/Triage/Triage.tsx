import { useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '../../components/layout';
import { Chip, RichText, SamoyedAvatar } from '../../components/ui';
import { MetaChip } from '../../components/task';
import { MemberAvatar, memberLabel } from '../../components/board';
import { useSwipe, type SwipeDirection } from '../../hooks/useSwipe';
import { useTriageQueue, type TriageAction, type TriageQueueItem } from '../../hooks/useTriageQueue';
import type { ResolveMissedAction } from '../../hooks/useTasks';
import { tryAppear } from '../../lib/samoyed';
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
  const areas = useLifeAreaLookup();
  const {
    current,
    upcoming,
    index,
    total,
    act,
    handTo,
    handTargets,
    others,
    sortAsOwner,
    isOwner,
    shared,
    actMissed,
    undo,
    canUndo,
    history,
    isLoading,
    error,
    done,
  } = useTriageQueue();
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
      if (e.key === 'Escape') {
        navigate('/today');
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
  }, [current, act, actMissed, undo, navigate]);

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

  const areaDot = (areaId?: string | null) => {
    const area = areaId ? areas.get(areaId) : undefined;
    return area ? lifeAreaColorVar(area.order) : 'transparent';
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>{t('triage.title')}</h1>
      <div className={styles.content}>
        <div className={styles.stage}>
          {!done && current && (
            <div className={styles.progress}>
              <span>{t('triage.progress', { index, total })}</span>
              <span className={styles.progressTrack} aria-hidden>
                <span className={styles.progressFill} style={{ width: `${(index / Math.max(total, 1)) * 100}%` }} />
              </span>
              <button type="button" className={styles.textButton} onClick={() => navigate('/today')}>
                <span className={styles.wideOnly}>{t('triage.escToStop')}</span>
                <span className={styles.narrowOnly}>{t('triage.stop')}</span>
              </button>
              {canUndo && (
                <button type="button" className={styles.textButton} onClick={undo}>
                  {t('triage.undo')}
                </button>
              )}
            </div>
          )}

          {done || !current ? (
            <div className={styles.complete}>
              {tryAppear('triageCleared') ? (
                <span className={styles.completeDog}>
                  <SamoyedAvatar moment="triageCleared" size={200} />
                </span>
              ) : (
                <span className={styles.completeIcon}>
                  <svg
                    width="30"
                    height="30"
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
                </span>
              )}
              <span className={styles.completeTitle}>{t('triage.emptyTitle')}</span>
              <span className={styles.completeDescription}>
                {t('triage.cardsSorted', { count: total })}
                {summary && `: ${summary}.`}
              </span>
              <button type="button" className={styles.completeButton} onClick={() => navigate('/today')}>
                {t('triage.goToToday')}
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cards} style={{ '--swipe-progress': swipe.progress } as CSSProperties}>
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

              <div className={styles.actions}>
                {!isMissed && (
                  <TriageButton arrow="←" label={t('triage.short.backlog')} onClick={() => act('backlog')} />
                )}
                <TriageButton
                  arrow="↑"
                  label={t('triage.short.done')}
                  onClick={() => (isMissed ? actMissed('done') : act('done'))}
                />
                <TriageButton
                  arrow="↓"
                  label={isMissed ? t('triage.dismissMissed') : t('triage.short.drop')}
                  tone="danger"
                  onClick={() => (isMissed ? actMissed('dismiss') : act('drop'))}
                />
                <TriageButton
                  arrow="→"
                  label={t('triage.short.today')}
                  tone="primary"
                  onClick={() => (isMissed ? actMissed('addToday') : act('today'))}
                />
              </div>

              {shared && !isMissed && handTargets.length > 0 && (
                <div className={styles.handTo}>
                  <span className={styles.sideLabel}>{t('triage.handTo')}</span>
                  {handTargets.map((member) => (
                    <button
                      key={member.userId}
                      type="button"
                      className={styles.handButton}
                      onClick={() => handTo(member)}
                    >
                      <MemberAvatar email={member.email} avatarKey={member.avatarKey} />
                      {memberLabel(member, t)}
                    </button>
                  ))}
                </div>
              )}

              <span className={styles.hint}>
                {t('triage.hint')}
                {!isMissed && canUndo && (
                  <>
                    {' · '}
                    <span className={styles.hintKey}>U</span> {t('triage.hintUndo')}
                  </>
                )}
              </span>
            </>
          )}
        </div>

        <aside className={styles.side}>
          {upcoming.length > 0 && (
            <div className={styles.sideSection}>
              <span className={styles.sideLabel}>
                {t('triage.stillToSort')} · {upcoming.length}
              </span>
              {upcoming.slice(0, 8).map((item) => (
                <div key={`${item.kind}-${item.task.id}`} className={styles.sideItem}>
                  <span className={styles.sideDot} style={{ background: areaDot(item.task.areaId) }} />
                  <span className={styles.sideTitle}>{item.task.title}</span>
                </div>
              ))}
            </div>
          )}
          {others.some(({ tasks }) => tasks.length > 0) && (
            <div className={styles.sideSection}>
              <span className={styles.sideLabel}>{t('triage.inOthers')}</span>
              {others
                .filter(({ tasks }) => tasks.length > 0)
                .map(({ member, tasks }) => (
                  <div key={member.userId} className={styles.sideItem}>
                    <MemberAvatar email={member.email} avatarKey={member.avatarKey} />
                    <span className={styles.sideTitle}>
                      {memberLabel(member, t)} · {t('triage.waiting', { count: tasks.length })}
                    </span>
                    {isOwner && (
                      <button type="button" className={styles.ownerSort} onClick={() => sortAsOwner(member.userId)}>
                        {t('triage.sortAsOwner')}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
          {history.length > 0 && (
            <div className={styles.sideSection}>
              <span className={styles.sideLabel}>
                {t('triage.sorted')} · {history.length}
              </span>
              {history.slice(-8).map((entry, i) => (
                <div key={`${entry.task.id}-${i}`} className={`${styles.sideItem} ${styles.sideItemSorted}`}>
                  <span className={styles.sideTitle}>{entry.task.title}</span>
                  <span className={styles.sideOutcome}>
                    {entry.handedTo
                      ? t('triage.handedTo', { name: memberLabel(entry.handedTo, t) })
                      : t(`triage.short.${entry.action}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

interface TriageButtonProps {
  arrow: string;
  label: string;
  tone?: 'primary' | 'danger';
  onClick: () => void;
}

/** A square arrow key with its label under it; the whole column is the button. */
function TriageButton({ arrow, label, tone, onClick }: TriageButtonProps) {
  return (
    <button type="button" className={`${styles.action} ${tone ? styles[tone] : ''}`} onClick={onClick}>
      <span className={styles.actionKey} aria-hidden>
        {arrow}
      </span>
      <span className={styles.actionLabel}>{label}</span>
    </button>
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
      <span className={styles.cardLead}>
        {isMissed ? t('triage.missedBadge', { date: missedDateLabel }) : t('triage.overdue', { count: overdue })}
      </span>

      <div className={styles.title}>{task.title}</div>
      {task.description && <RichText html={task.description} className={styles.description} />}

      <div className={styles.metaRow}>
        {task.priority && <MetaChip plain axis="priority" value={task.priority} />}
        {area && (
          <Chip variant="plain" dot={lifeAreaColorVar(area.order)}>
            {area.name}
          </Chip>
        )}
        {task.estimatedMinutes != null && <MetaChip plain axis="effort" minutes={task.estimatedMinutes} />}
        {task.energy && <MetaChip plain axis="energy" value={task.energy} />}
      </div>
    </>
  );
}
