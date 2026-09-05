import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, PageState } from '../../components/layout';
import { Button, Chip } from '../../components/ui';
import { MetaChip } from '../../components/task';
import { useTriageQueue, type TriageAction } from '../../hooks/useTriageQueue';
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

export default function Triage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { current, index, total, act, undo, canUndo, history, isLoading, error, done } = useTriageQueue();
  const areas = useLifeAreaLookup();
  const currentArea = current?.areaId ? areas.get(current.areaId) : undefined;

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [current, act, undo]);

  if (isLoading) return <PageState>{t('triage.loading')}</PageState>;
  if (error) return <PageState>{t('triage.error')}</PageState>;

  const overdue = current ? daysOverdue(current) : 0;

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
      <PageHeader
        title={t('triage.title')}
        subtitle={done ? undefined : t('triage.subtitle', { index, total })}
        actions={
          canUndo ? (
            <Button variant="ghost" onClick={undo}>
              {t('triage.undo')}
            </Button>
          ) : undefined
        }
      />

      <div className={styles.content}>
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
          <div className={styles.card}>
            <div className={styles.badgeRow}>
              <Chip variant="danger" pill>
                {current.priority ? `${current.priority} · ` : ''}
                {t('triage.overdue', { count: overdue })}
              </Chip>
              {currentArea && (
                <span className={styles.area}>
                  <span className={styles.areaDot} style={{ background: lifeAreaColorVar(currentArea.order) }} />
                  {currentArea.name}
                </span>
              )}
            </div>

            <div className={styles.title}>{current.title}</div>
            {current.description && <p className={styles.description}>{current.description}</p>}

            <div className={styles.metaRow}>
              {current.estimatedMinutes != null && <MetaChip axis="effort" minutes={current.estimatedMinutes} />}
              {current.energy && <MetaChip axis="energy" value={current.energy} />}
            </div>

            <div className={styles.actions}>
              <button type="button" className={`${styles.action} ${styles.today}`} onClick={() => act('today')}>
                {t('triage.moveToToday')}
                <span className={styles.key}>→</span>
              </button>
              <button type="button" className={`${styles.action} ${styles.backlog}`} onClick={() => act('backlog')}>
                {t('triage.sendToBacklog')}
                <span className={styles.key}>←</span>
              </button>
              <button type="button" className={`${styles.action} ${styles.done}`} onClick={() => act('done')}>
                {t('triage.itsDone')}
                <span className={styles.key}>↑</span>
              </button>
              <button type="button" className={`${styles.action} ${styles.drop}`} onClick={() => act('drop')}>
                {t('triage.dropIt')}
                <span className={styles.key}>↓</span>
              </button>
            </div>

            <span className={styles.hint}>
              {t('triage.hint')}{' '}
              {canUndo && (
                <>
                  <span className={styles.hintKey}>U</span> {t('triage.hintUndo')}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
