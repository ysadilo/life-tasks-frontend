import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { useBoardMembers } from '../../hooks/useBoards';
import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../models';
import { MemberAvatar } from './BoardTile';
import { memberLabel } from './memberLabel';
import styles from './board.module.css';

const VIEWPORT_MARGIN = 16;

/** Below the anchor, clamped inside the viewport. Rows sit in transformed containers, so the popover is portaled to <body>. */
function usePortaledPosition(anchorRef: RefObject<HTMLElement>, popoverRef: RefObject<HTMLElement>) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(rect.left, VIEWPORT_MARGIN), window.innerWidth - popover.offsetWidth - VIEWPORT_MARGIN),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, popoverRef]);
  return position;
}

function AssignPopover({
  task,
  anchorRef,
  onClose,
}: {
  task: Task;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { members } = useBoardMembers();
  const updateTask = useUpdateTask();
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const position = usePortaledPosition(anchorRef, ref);

  const assign = (assigneeId: string | null) => {
    if (assigneeId !== (task.assigneeId ?? null)) updateTask.mutate({ id: task.id, title: task.title, assigneeId });
    onClose();
  };

  return createPortal(
    <div
      ref={ref}
      className={styles.popover}
      style={position ?? undefined}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className={styles.groupLabel}>{t('board.assignTo')}</span>
      {members.map((m) => (
        <button key={m.userId} type="button" role="menuitem" className={styles.row} onClick={() => assign(m.userId)}>
          <MemberAvatar email={m.email} avatarKey={m.avatarKey} />
          <span className={styles.rowText}>
            <span className={styles.rowName}>{memberLabel(m, t)}</span>
          </span>
          {m.userId === task.assigneeId && <span aria-hidden>✓</span>}
        </button>
      ))}
      <button type="button" role="menuitem" className={styles.row} onClick={() => assign(null)}>
        <span className={styles.rowMeta}>{t('board.anyoneCanTake')}</span>
      </button>
    </div>,
    document.body
  );
}

/** Assignee pill on a task row; opens the assign popover. Renders nothing on personal boards. */
export function AssigneeChip({ task }: { task: Task }) {
  const { t } = useTranslation();
  const { shared, byId } = useBoardMembers();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  if (!shared) return null;

  const assignee = task.assigneeId ? byId.get(task.assigneeId) : undefined;

  return (
    <span className={styles.assigneeWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={[styles.assignee, assignee ? '' : styles.assigneeEmpty].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        // Keeps useOutsideClick from closing the popover just before this click toggles it.
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {assignee ? (
          <>
            <MemberAvatar email={assignee.email} avatarKey={assignee.avatarKey} />
            {memberLabel(assignee, t)}
          </>
        ) : (
          t('board.assign')
        )}
      </button>
      {open && <AssignPopover task={task} anchorRef={buttonRef} onClose={() => setOpen(false)} />}
    </span>
  );
}
