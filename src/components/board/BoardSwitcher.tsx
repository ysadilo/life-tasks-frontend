import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { useAnchoredPopoverPosition } from '../../hooks/useAnchoredPopoverPosition';
import { useActiveBoard, useBoardInvites } from '../../hooks/useBoards';
import { BoardList } from './BoardList';
import { BoardTile } from './BoardTile';
import { newBoardModal } from './newBoardModalStore';
import styles from './board.module.css';

function SwitcherPopover({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const position = useAnchoredPopoverPosition(ref);

  return (
    <div ref={ref} className={styles.popover} style={position ?? undefined}>
      <BoardList onDone={onClose} searchable />
    </div>
  );
}

/** Sidebar header: the active board, opening the board picker (⌘B). ⌘⇧B starts a new board. */
export function BoardSwitcher() {
  const { t } = useTranslation();
  const board = useActiveBoard();
  const { data: invites } = useBoardInvites();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'b') return;
      e.preventDefault();
      if (e.shiftKey) newBoardModal.open();
      else setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={styles.switcher}>
      <button
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {board && <BoardTile id={board.id} name={board.name} />}
        <span className={styles.rowText}>
          <span className={styles.rowName}>{board?.name ?? '…'}</span>
          <span className={styles.rowMeta}>
            {board?.shared ? t('board.sharedMeta', { count: board.members.length }) : t('board.switchHint')}
          </span>
        </span>
        {!!invites?.length && <span className={styles.badge}>{invites.length}</span>}
        <span aria-hidden>{open ? '⌃' : '⌄'}</span>
      </button>
      {open && <SwitcherPopover onClose={close} />}
    </div>
  );
}
