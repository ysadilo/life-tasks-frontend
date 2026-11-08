import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PillButton } from '../ui/PillButton';
import { useCreateBoard } from '../../hooks/useBoards';
import { MAX_LIFE_AREAS } from '../../lib/lifeAreas';
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
/** The first suggestions are preselected, matching the server's default set. */
const PRESELECTED = 5;

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function NewBoardForm() {
  const { t } = useTranslation();
  const create = useCreateBoard();
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);
  const [invites, setInvites] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  // Suggestions come in the current UI language, so the board's areas are created in it too.
  const suggestions = t('board.areaSuggestions', { returnObjects: true }) as string[];
  const [areas, setAreas] = useState<string[]>(() => suggestions.slice(0, PRESELECTED));
  const [areaName, setAreaName] = useState('');
  const custom = areas.filter((a) => !suggestions.some((s) => sameName(s, a)));
  const full = areas.length >= MAX_LIFE_AREAS;

  const toggleArea = (area: string) =>
    setAreas(areas.some((a) => sameName(a, area)) ? areas.filter((a) => !sameName(a, area)) : [...areas, area]);

  const addArea = () => {
    const value = areaName.trim();
    if (!value || full) return;
    if (!areas.some((a) => sameName(a, value))) setAreas([...areas, value]);
    setAreaName('');
  };

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
    create.mutate(
      { name: trimmed, shared, invites: shared ? invites : [], lifeAreas: areas },
      { onSuccess: newBoardModal.close }
    );
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

      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('board.lifeAreas')}</span>
        <div className={styles.areaChips}>
          {[...suggestions, ...custom].map((area) => {
            const selected = areas.some((a) => sameName(a, area));
            return (
              <PillButton
                key={area}
                aria-pressed={selected}
                disabled={!selected && full}
                className={selected ? styles.areaChipActive : undefined}
                onClick={() => toggleArea(area)}
              >
                {area}
              </PillButton>
            );
          })}
        </div>
        <div className={styles.inviteRow}>
          <Input
            value={areaName}
            maxLength={40}
            placeholder={t('board.areaPlaceholder')}
            onChange={(e) => setAreaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              addArea();
            }}
          />
          <Button type="button" onClick={addArea} disabled={!areaName.trim() || full}>
            {t('board.add')}
          </Button>
        </div>
        <p className={styles.hint}>{t('board.areasHint', { count: areas.length, max: MAX_LIFE_AREAS })}</p>
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
        <Button type="submit" variant="primary" disabled={!name.trim() || !areas.length || create.isPending}>
          {t('board.create')}
        </Button>
      </div>
    </form>
  );
}
