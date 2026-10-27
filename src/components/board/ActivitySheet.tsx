import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '../ui';
import type { ActivityEntry } from '../../models';
import { useBoardMembers } from '../../hooks/useBoards';
import { ActivityRow } from './ActivityRow';
import styles from './board.module.css';

interface ActivitySheetProps {
  open: boolean;
  onClose: () => void;
  entries: ActivityEntry[];
  isUnread: (entry: ActivityEntry) => boolean;
  onMarkAllRead: () => void;
}

/** Mobile activity list: everything on the board, or only what was handed to you, newest first. */
export function ActivitySheet({ open, onClose, entries, isUnread, onMarkAllRead }: ActivitySheetProps) {
  const { t, i18n } = useTranslation();
  const { me } = useBoardMembers();
  const [forMeOnly, setForMeOnly] = useState(false);

  const isForMe = (entry: ActivityEntry) => entry.type === 'assigned' && entry.targetUserId === me?.userId;
  const forMeCount = entries.filter(isForMe).length;
  const visible = forMeOnly ? entries.filter(isForMe) : entries;

  const todayKey = new Date().toDateString();
  const groups = [
    {
      label: t('board.activityToday'),
      entries: visible.filter((e) => new Date(e.createdAt).toDateString() === todayKey),
    },
    {
      label: t('board.activityEarlier'),
      entries: visible.filter((e) => new Date(e.createdAt).toDateString() !== todayKey),
    },
  ].filter((group) => group.entries.length > 0);

  return (
    <SidePanel open={open} onClose={onClose} title={t('board.activityTitle')}>
      <div className={styles.sheetBody}>
        <div className={styles.sheetTools}>
          <div className={styles.filterPills}>
            <button
              type="button"
              className={[styles.filterPill, forMeOnly ? '' : styles.filterPillActive].filter(Boolean).join(' ')}
              onClick={() => setForMeOnly(false)}
            >
              {t('board.activityAll')}
            </button>
            <button
              type="button"
              className={[styles.filterPill, forMeOnly ? styles.filterPillActive : ''].filter(Boolean).join(' ')}
              onClick={() => setForMeOnly(true)}
            >
              {t('board.activityForMe', { count: forMeCount })}
            </button>
          </div>
          <button type="button" className={styles.linkButton} onClick={onMarkAllRead}>
            {t('board.markAllRead')}
          </button>
        </div>
        {groups.length === 0 && <span className={styles.rowMeta}>{t('board.activityEmpty')}</span>}
        {groups.map((group) => (
          <div key={group.label} className={styles.sheetGroup}>
            <span className={styles.groupLabel}>{group.label}</span>
            {group.entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} locale={i18n.language} unread={isUnread(entry)} />
            ))}
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
