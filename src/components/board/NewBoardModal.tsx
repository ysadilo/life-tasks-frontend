import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCreateBoard } from '../../hooks/useBoards';
import { newBoardModal, useNewBoardModalOpen } from './newBoardModalStore';
import styles from './board.module.css';

/** Mount once (see AppShell); opened via `newBoardModal.open()`. */
export function NewBoardModal() {
  const open = useNewBoardModalOpen();
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={newBoardModal.close} closeLabel={t('board.close')} title={t('board.newBoardTitle')}>
      {open && <NewBoardForm />}
    </Modal>
  );
}

const EMAIL = /^\S+@\S+\.\S+$/;

function NewBoardForm() {
  const { t } = useTranslation();
  const create = useCreateBoard();
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);
  const [invites, setInvites] = useState<string[]>([]);
  const [email, setEmail] = useState('');

  const addInvite = () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value) || invites.includes(value)) return;
    setInvites([...invites, value]);
    setEmail('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate({ name: trimmed, shared, invites: shared ? invites : [] }, { onSuccess: newBoardModal.close });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('board.name')}</span>
        <Input
          autoFocus
          value={name}
          placeholder={t('board.namePlaceholder')}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className={styles.field} role="radiogroup" aria-label={t('board.whoFor')}>
        <span className={styles.fieldLabel}>{t('board.whoFor')}</span>
        <div className={styles.choices}>
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              role="radio"
              aria-checked={shared === value}
              className={[styles.choice, shared === value ? styles.choiceActive : ''].filter(Boolean).join(' ')}
              onClick={() => setShared(value)}
            >
              <span className={styles.rowName}>{t(value ? 'board.shared' : 'board.justMe')}</span>
              <span className={styles.rowMeta}>{t(value ? 'board.sharedHint' : 'board.justMeHint')}</span>
            </button>
          ))}
        </div>
      </div>

      {shared && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('board.invitePeople')}</span>
          <div className={styles.inviteRow}>
            <Input
              type="email"
              value={email}
              placeholder={t('board.emailPlaceholder')}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                addInvite();
              }}
            />
            <Button type="button" onClick={addInvite} disabled={!EMAIL.test(email.trim())}>
              {t('board.add')}
            </Button>
          </div>
          {invites.map((invited) => (
            <div key={invited} className={styles.invited}>
              <span className={styles.memberName}>{invited}</span>
              <button
                type="button"
                className={styles.declineButton}
                aria-label={t('board.removeInvite', { email: invited })}
                onClick={() => setInvites(invites.filter((i) => i !== invited))}
              >
                ×
              </button>
            </div>
          ))}
          <p className={styles.hint}>{t('board.visibilityHint')}</p>
        </div>
      )}

      {create.isError && <p role="alert">{t('board.createFailed')}</p>}
      <div className={styles.actions}>
        <Button type="button" onClick={newBoardModal.close}>
          {t('board.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim() || create.isPending}>
          {t('board.create')}
        </Button>
      </div>
    </form>
  );
}
