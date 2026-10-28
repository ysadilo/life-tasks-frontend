import { useTranslation } from 'react-i18next';
import { ConfirmDialog, toast } from '../ui';
import { useRevokeAgent } from '../../hooks/useAgents';
import type { Agent } from '../../models';

interface RevokeAgentDialogProps {
  /** The agent being revoked; null keeps the dialog closed. */
  agent: Agent | null;
  onClose: () => void;
}

/** Confirms, then cuts an agent off. Shared by the agent list and the permissions card. */
export function RevokeAgentDialog({ agent, onClose }: RevokeAgentDialogProps) {
  const { t } = useTranslation();
  const revoke = useRevokeAgent();

  return (
    <ConfirmDialog
      open={agent !== null}
      title={t('agents.connected.revoke')}
      message={t('agents.connected.revokeConfirm', { name: agent?.name })}
      confirmLabel={t('agents.connected.revoke')}
      cancelLabel={t('board.cancel')}
      onCancel={onClose}
      onConfirm={() => {
        if (agent) revoke.mutate(agent.id, { onSuccess: () => toast.show(t('agents.connected.revoked')) });
        onClose();
      }}
    />
  );
}
