import { useEffect, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { MetaChip } from '../MetaChip';
import { useCreateTask } from '../../../hooks/useTasks';
import { useLifeAreas } from '../../../hooks/useLifeAreas';
import { draftToInput, parseQuickAdd } from '../../../lib/quickAdd';
import { dayMonthLabel } from '../../../lib/dateUtils';
import type { TaskStatus } from '../../../models';
import { quickAdd, useQuickAddOpen } from '../quickAddStore';
import { taskForm } from '../taskFormStore';
import styles from './QuickAddModal.module.css';

/** Mount once (see AppShell). Opened with ⌘K / Ctrl+K or `quickAdd.open()`. */
export function QuickAddModal() {
  const open = useQuickAddOpen();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        quickAdd.open();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Modal open={open} onClose={quickAdd.close} title={t('quickAdd.title')} closeLabel={t('taskForm.close')}>
      <QuickAddForm locale={i18n.language} />
    </Modal>
  );
}

function QuickAddForm({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const { data: areas = [] } = useLifeAreas();
  const createTask = useCreateTask();
  const [line, setLine] = useState('');

  const draft = parseQuickAdd(line, areas);
  const area = areas.find((a) => a.id === draft.areaId);
  const blocked = !draft.title || createTask.isPending;

  const add = (status: TaskStatus) => {
    if (blocked) return;
    createTask.mutate(draftToInput(draft, status, false), { onSuccess: quickAdd.close });
  };

  const openDetails = () => {
    if (!draft.title) return;
    quickAdd.close();
    taskForm.openNew(null, draft);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) openDetails();
    else add(e.shiftKey ? 'backlog' : 'today');
  };

  const hasChips = draft.dueDate || draft.priority || area || draft.minutes;

  return (
    <div className={styles.form}>
      <input
        autoFocus
        className={styles.line}
        placeholder={t('quickAdd.placeholder')}
        value={line}
        onChange={(e) => setLine(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {hasChips && (
        <div className={styles.chips}>
          <span className={styles.willAdd}>{t('quickAdd.willAdd')}</span>
          {draft.dueDate && <span className={styles.chip}>{dayMonthLabel(draft.dueDate, locale)}</span>}
          {draft.priority && <MetaChip axis="priority" value={draft.priority} />}
          {area && <span className={styles.chip}>{area.name}</span>}
          {draft.minutes && <MetaChip axis="effort" minutes={draft.minutes} />}
        </div>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={blocked} onClick={() => add('today')}>
          {t('quickAdd.addToday')}
          <kbd className={styles.kbd}>↵</kbd>
        </button>
        <button type="button" className={styles.action} disabled={blocked} onClick={() => add('backlog')}>
          {t('quickAdd.addBacklog')}
          <kbd className={styles.kbd}>⇧ ↵</kbd>
        </button>
        <button type="button" className={styles.action} disabled={!draft.title} onClick={openDetails}>
          {t('quickAdd.openDetails')}
          <kbd className={styles.kbd}>⌘ ↵</kbd>
        </button>
      </div>
      {createTask.isError && <p className={styles.error}>{t('quickAdd.error')}</p>}
    </div>
  );
}
