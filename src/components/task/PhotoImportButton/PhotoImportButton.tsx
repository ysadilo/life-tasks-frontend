import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { usePhotoImport } from '../../../hooks/usePhotoImport';
import { taskForm } from '../taskFormStore';

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
      onSuccess: ([first, ...rest]) => {
        if (!first) return toast.show(t('photo.empty'));
        if (rest.length) toast.show(t('photo.multiple', { count: rest.length + 1 }));
        // A deadline read from the photo beats the calendar day the panel was opened from.
        taskForm.openNew(first.dueDate ? null : presetDate, first);
      },
      onError: () => toast.show(t('photo.error')),
    });
  };

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={onPick} />
      <Button type="button" variant="ghost" disabled={photo.isPending} onClick={() => input.current?.click()}>
        {photo.isPending ? t('photo.reading') : t('photo.button')}
      </Button>
    </>
  );
}
