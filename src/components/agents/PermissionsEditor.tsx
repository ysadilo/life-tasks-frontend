import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog, SegmentedTabs } from '../ui';
import { useBoards } from '../../hooks/useBoards';
import { AGENT_PERMISSIONS } from '../../lib/agents';
import { colorFor, initialOf } from '../board/boardColors';
import type { AgentPermission } from '../../models';
import styles from './agents.module.css';

function AllowToggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={label}>
      <SegmentedTabs
        size="sm"
        value={on ? 'on' : 'off'}
        onChange={(value) => onChange(value === 'on')}
        options={[
          { value: 'on', label: t('agents.permissions.allow') },
          { value: 'off', label: t('agents.permissions.off') },
        ]}
      />
    </div>
  );
}

interface PermissionsEditorProps {
  agentName: string;
  permissions: AgentPermission[];
  boardIds: string[];
  onPermissionsChange: (permissions: AgentPermission[]) => void;
  onBoardsChange: (boardIds: string[]) => void;
}

/**
 * Boards an agent may use plus its Allow/Off permission rows. Controlled, so it serves both the
 * Settings card (saves each change) and the approval page (saves once, on Allow).
 */
export function PermissionsEditor({
  agentName,
  permissions,
  boardIds,
  onPermissionsChange,
  onBoardsChange,
}: PermissionsEditorProps) {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const setPermission = (permission: AgentPermission, on: boolean) =>
    onPermissionsChange(on ? [...permissions, permission] : permissions.filter((p) => p !== permission));

  const setBoard = (boardId: string, on: boolean) =>
    onBoardsChange(on ? [...boardIds, boardId] : boardIds.filter((id) => id !== boardId));

  return (
    <>
      <div className={styles.block}>
        <span className={styles.label}>{t('agents.permissions.boards')}</span>
        <div className={styles.boardChips}>
          {boards?.map((board) => {
            const on = boardIds.includes(board.id);
            return (
              <button
                key={board.id}
                type="button"
                aria-pressed={on}
                className={[styles.boardChip, on ? styles.boardChipOn : ''].filter(Boolean).join(' ')}
                onClick={() => setBoard(board.id, !on)}
              >
                <span className={styles.boardLetter} style={{ background: colorFor(board.id) }} aria-hidden>
                  {initialOf(board.name)}
                </span>
                {board.name}
                {on ? (
                  <span aria-hidden>✓</span>
                ) : (
                  board.shared && <span className={styles.meta}>{t('agents.permissions.sharedOff')}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className={styles.note}>{t('agents.permissions.sharedNote')}</p>
      </div>

      <div className={styles.perms}>
        {AGENT_PERMISSIONS.map((permission) => (
          <div key={permission} className={styles.permRow}>
            <div className={styles.permText}>
              <span className={styles.permName}>{t(`agents.permissions.${permission}.name`)}</span>
              <span className={styles.meta}>{t(`agents.permissions.${permission}.hint`)}</span>
            </div>
            {permission === 'delete' && <span className={styles.badgeDanger}>{t('agents.permissions.cantUndo')}</span>}
            <AllowToggle
              on={permissions.includes(permission)}
              label={t(`agents.permissions.${permission}.name`)}
              onChange={(on) =>
                permission === 'delete' && on ? setConfirmingDelete(true) : setPermission(permission, on)
              }
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('agents.permissions.delete.name')}
        message={t('agents.permissions.deleteConfirm', { name: agentName })}
        confirmLabel={t('agents.permissions.allow')}
        cancelLabel={t('board.cancel')}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setPermission('delete', true);
          setConfirmingDelete(false);
        }}
      />
    </>
  );
}
