import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '../../components/layout';
import { Button } from '../../components/ui';
import { AgentAvatar, PermissionsEditor } from '../../components/agents';
import { useApproveAgent, useConnectRequest } from '../../hooks/useAgents';
import { useBoards } from '../../hooks/useBoards';
import type { AgentPermission } from '../../models';
import styles from './AgentConnectPage.module.css';

/** What a new agent may do until the user says otherwise — the same defaults the server uses. */
const DEFAULT_PERMISSIONS: AgentPermission[] = ['read', 'add'];

/**
 * An AI assistant asked to connect and the person has signed in; here they choose what it may do.
 * "Allow" saves the choice and sends the browser back to the assistant with its code; "Cancel" refuses.
 */
export default function AgentConnectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestId = params.get('request') ?? '';
  const { data: request, isLoading, isError } = useConnectRequest(requestId);
  const { data: boards } = useBoards();
  const approve = useApproveAgent();
  const goBack = (input: Parameters<typeof approve.mutate>[0]) =>
    approve.mutate(input, { onSuccess: ({ redirectUrl }) => window.location.replace(redirectUrl) });

  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [chosenBoards, setChosenBoards] = useState<string[] | null>(null);
  // Personal boards unless the user picks otherwise; a shared board is an explicit opt-in.
  const boardIds = chosenBoards ?? boards?.filter((b) => !b.shared).map((b) => b.id) ?? [];

  // Already approved earlier: nothing to ask, send the assistant on with its code.
  useEffect(() => {
    if (request?.alreadyConnected)
      approve.mutate({ request: requestId }, { onSuccess: ({ redirectUrl }) => window.location.replace(redirectUrl) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the request arrives
  }, [request?.alreadyConnected]);

  if (!requestId || isError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('agents.connectPage.invalidTitle')}</h1>
          <p className={styles.hint}>{t('agents.connectPage.invalidHint')}</p>
          <Button onClick={() => navigate('/settings/agents')}>{t('agents.connectPage.toSettings')}</Button>
        </div>
      </div>
    );
  }
  if (isLoading || !request || request.alreadyConnected)
    return <PageState>{t('agents.connectPage.loading')}</PageState>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AgentAvatar name={request.name} />
        <h1 className={styles.title}>{t('agents.connectPage.title', { name: request.name })}</h1>
        <p className={styles.hint}>{t('agents.connectPage.hint', { name: request.name })}</p>
        <p className={styles.note}>{t('agents.connectPage.from', { host: request.redirectHost })}</p>

        <PermissionsEditor
          agentName={request.name}
          permissions={permissions}
          boardIds={boardIds}
          onPermissionsChange={setPermissions}
          onBoardsChange={setChosenBoards}
        />

        {approve.isError && <p role="alert">{t('board.actionFailed')}</p>}
        <div className={styles.actions}>
          <Button
            variant="primary"
            disabled={approve.isPending || boardIds.length === 0}
            onClick={() => goBack({ request: requestId, permissions, boardIds })}
          >
            {t('agents.connectPage.allow')}
          </Button>
          <Button
            variant="ghost"
            disabled={approve.isPending}
            onClick={() => goBack({ request: requestId, deny: true })}
          >
            {t('board.cancel')}
          </Button>
        </div>
        {boardIds.length === 0 && <p className={styles.hint}>{t('agents.connectPage.pickBoard')}</p>}
      </div>
    </div>
  );
}
