import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../ui/Toast';
import { usePhotoImport } from '../../../hooks/usePhotoImport';
import { taskForm } from '../taskFormStore';
import styles from './PhotoImportButton.module.css';

/** "From photo" in the New task header: pick or take a picture and the form below is prefilled from it. */
export function PhotoImportButton({ presetDate }: { presetDate: string | null }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const photo = usePhotoImport();

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    photo.mutate(file, {
      onSuccess: (drafts) => {
        switch (drafts.length) {
          case 0:
            return toast.show(t('photo.empty'));
          case 1:
            // A deadline read from the photo beats the calendar day the panel was opened from.
            return taskForm.openNew(drafts[0].dueDate ? null : presetDate, drafts[0]);
          default:
            return taskForm.openBatch(drafts, URL.createObjectURL(file));
        }
      },
      onError: () => toast.show(t('photo.error')),
    });
  };

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={onPick} />
      <button type="button" className={styles.button} disabled={photo.isPending} onClick={() => input.current?.click()}>
        <span className={styles.badge} aria-hidden>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5c.4 3 1.9 4.6 5 5-3.1.4-4.6 2-5 5-.4-3-1.9-4.6-5-5 3.1-.4 4.6-2 5-5Z" fill="currentColor" />
          </svg>
        </span>
        {photo.isPending ? t('photo.reading') : t('photo.button')}
        <span className={styles.tag}>{t('photo.aiTag')}</span>
      </button>
    </>
  );
}
