import { useTranslation } from 'react-i18next';
import { useCreateInviteLink, useDisableInviteLink } from '../../hooks/useBoards';
import { copyInviteLink, inviteUrl } from '../../lib/inviteLink';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { toast } from '../ui/Toast';
import { useState } from 'react';
import styles from './board.module.css';

/** The join link: who can use it, copy / turn off. Anyone signed in with the link joins as an editor. */
export function InviteLinkSettings({ boardId, code }: { boardId: string; code: string | null }) {
  const { t } = useTranslation();
  const create = useCreateInviteLink();
  const disable = useDisableInviteLink();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.linkBlock}>
      <span className={styles.groupLabel}>{t('board.inviteLink')}</span>
      <p className={styles.hint}>{t('board.inviteLinkHint')}</p>
      {code ? (
        <>
          <input
            className={styles.linkInput}
            readOnly
            value={inviteUrl(code)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className={styles.manageActions}>
            <Button onClick={() => copyInviteLink(code, t('board.linkCopied'), t('board.actionFailed'))}>
              {t('board.copyLink')}
            </Button>
            <button type="button" className={styles.dangerButton} onClick={() => setConfirming(true)}>
              {t('board.disableLink')}
            </button>
          </div>
        </>
      ) : (
        <div className={styles.manageActions}>
          <Button disabled={create.isPending} onClick={() => create.mutate(boardId)}>
            {t('board.createLink')}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title={t('board.inviteLink')}
        message={t('board.disableLinkConfirm')}
        confirmLabel={t('board.disableLink')}
        cancelLabel={t('board.cancel')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          disable.mutate(boardId, { onSuccess: () => toast.show(t('board.linkDisabled')) });
          setConfirming(false);
        }}
      />
    </div>
  );
}
