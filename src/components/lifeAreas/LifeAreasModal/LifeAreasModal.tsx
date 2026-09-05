import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useLifeAreas, useCreateLifeArea, useRenameLifeArea, useDeleteLifeArea } from '../../../hooks/useLifeAreas';
import { MAX_LIFE_AREAS, lifeAreaColorVar } from '../../../lib/lifeAreas';
import { lifeAreasModal, useLifeAreasModalOpen } from '../lifeAreasModalStore';
import styles from './LifeAreasModal.module.css';

/** Mount once (see AppShell); opened from anywhere via `lifeAreasModal.openManage()`. */
export function LifeAreasModal() {
  const open = useLifeAreasModalOpen();
  const { t } = useTranslation();
  const onClose = lifeAreasModal.close;

  return (
    <Modal open={open} onClose={onClose} closeLabel={t('lifeAreasModal.close')} title={t('lifeAreasModal.title')}>
      {open && <LifeAreasManager />}
    </Modal>
  );
}

function LifeAreasManager() {
  const { t } = useTranslation();
  const { data: areas } = useLifeAreas();
  const createArea = useCreateLifeArea();
  const renameArea = useRenameLifeArea();
  const deleteArea = useDeleteLifeArea();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');

  const count = areas?.length ?? 0;
  const atLimit = count >= MAX_LIFE_AREAS;

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const saveRename = (id: string) => {
    const name = editValue.trim();
    if (!name) return;
    renameArea.mutate({ id, name }, { onSuccess: () => setEditingId(null) });
  };

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || atLimit) return;
    createArea.mutate(name, { onSuccess: () => setNewName('') });
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.subtitle}>{t('lifeAreasModal.subtitle', { count, max: MAX_LIFE_AREAS })}</p>

      <div className={styles.list}>
        {areas?.map((area) => (
          <div key={area.id} className={styles.row}>
            <span className={styles.colorBar} style={{ background: lifeAreaColorVar(area.order) }} />
            {editingId === area.id ? (
              <>
                <Input
                  autoFocus
                  className={styles.renameInput}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                />
                <Button variant="primary" onClick={() => saveRename(area.id)} disabled={!editValue.trim()}>
                  {t('lifeAreasModal.save')}
                </Button>
                <button type="button" className={styles.textButton} onClick={() => setEditingId(null)}>
                  {t('lifeAreasModal.cancel')}
                </button>
              </>
            ) : (
              <>
                <span className={styles.name}>{area.name}</span>
                <span className={styles.taskCount}>{t('lifeAreasModal.tasksCount', { count: area.taskCount })}</span>
                <button type="button" className={styles.button} onClick={() => startRename(area.id, area.name)}>
                  {t('lifeAreasModal.rename')}
                </button>
                <button type="button" className={styles.textButton} onClick={() => deleteArea.mutate(area.id)}>
                  {t('lifeAreasModal.delete')}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form className={styles.addBox} onSubmit={onAdd}>
        <span className={styles.addLabel}>{t('lifeAreasModal.addLabel')}</span>
        <div className={styles.addRow}>
          <Input
            placeholder={t('lifeAreasModal.addPlaceholder')}
            value={newName}
            disabled={atLimit}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={atLimit || !newName.trim() || createArea.isPending}>
            {t('lifeAreasModal.add')}
          </Button>
        </div>
        <div className={styles.nextColor}>
          <span>{t('lifeAreasModal.nextColor')}</span>
          <span className={styles.swatch} style={{ background: lifeAreaColorVar(count) }} />
          <span>{t('lifeAreasModal.nextColorHint')}</span>
        </div>
      </form>

      <p className={styles.footnote}>{t('lifeAreasModal.limitNote', { max: MAX_LIFE_AREAS })}</p>
    </div>
  );
}
