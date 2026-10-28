import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog, SegmentedTabs } from '../ui';
import { useBoards } from '../../hooks/useBoards';
import { useUpdateAgent } from '../../hooks/useAgents';
import { AGENT_PERMISSIONS } from '../../lib/agents';
import { colorFor, initialOf } from '../board/boardColors';
import type { Agent, AgentPermission } from '../../models';
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

/** What one agent may do, and on which boards. Changes apply to its very next call. */
export function AgentPermissions({ agent, onRevoke }: { agent: Agent; onRevoke: (agent: Agent) => void }) {
  const { t } = useTranslation();
  const { data: boards } = useBoards();
  const update = useUpdateAgent();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const setPermission = (permission: AgentPermission, on: boolean) =>
    update.mutate({
      id: agent.id,
      permissions: on ? [...agent.permissions, permission] : agent.permissions.filter((p) => p !== permission),
    });

  const setBoard = (boardId: string, on: boolean) =>
    update.mutate({
      id: agent.id,
      boardIds: on ? [...agent.boardIds, boardId] : agent.boardIds.filter((id) => id !== boardId),
    });

  return (
    <section id="permissions" className={styles.card}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{t('agents.permissions.title', { name: agent.name })}</h2>
        <p className={styles.hint}>{t('agents.permissions.hint')}</p>
      </div>

      <div className={styles.block}>
        <span className={styles.label}>{t('agents.permissions.boards')}</span>
        <div className={styles.boardChips}>
          {boards?.map((board) => {
            const on = agent.boardIds.includes(board.id);
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
              on={agent.permissions.includes(permission)}
              label={t(`agents.permissions.${permission}.name`)}
              onChange={(on) =>
                permission === 'delete' && on ? setConfirmingDelete(true) : setPermission(permission, on)
              }
            />
          </div>
        ))}
      </div>

      <button type="button" className={styles.dangerLink} onClick={() => onRevoke(agent)}>
        {t('agents.permissions.revokeAccess', { name: agent.name })}
      </button>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('agents.permissions.delete.name')}
        message={t('agents.permissions.deleteConfirm', { name: agent.name })}
        confirmLabel={t('agents.permissions.allow')}
        cancelLabel={t('board.cancel')}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setPermission('delete', true);
          setConfirmingDelete(false);
        }}
      />
    </section>
  );
}
