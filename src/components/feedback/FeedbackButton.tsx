import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button, Modal, toast } from '../ui';
import { useSendFeedback } from '../../hooks/useSendFeedback';
import styles from './FeedbackButton.module.css';

export function FeedbackButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const send = useSendFeedback();

  const close = () => setOpen(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send.mutate(
      { message: message.trim(), page: pathname },
      {
        onSuccess: () => {
          toast.show(t('feedback.thanks'));
          setMessage('');
          close();
        },
      }
    );
  };

  return (
    <>
      <Button className={className} onClick={() => setOpen(true)}>
        {t('feedback.button')}
      </Button>
      <Modal open={open} onClose={close} title={t('feedback.title')} closeLabel={t('feedback.cancel')}>
        <form onSubmit={submit}>
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.placeholder')}
            maxLength={2000}
            rows={6}
            autoFocus
            required
          />
          {send.isError && <p className={styles.error}>{t('feedback.error')}</p>}
          <div className={styles.actions}>
            <Button type="button" onClick={close}>
              {t('feedback.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={!message.trim() || send.isPending}>
              {t('feedback.send')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
