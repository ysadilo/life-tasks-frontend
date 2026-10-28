import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '../../components/layout';
import { Button } from '../../components/ui';
import { AgentAvatar, PermissionsEditor } from '../../components/agents';
import { useAuthorizeAgent, useConnectRequest } from '../../hooks/useAgents';
import { useBoards } from '../../hooks/useBoards';
import { agentContinueUrl } from '../../lib/agents';
import type { AgentPermission } from '../../models';
import styles from './AgentConnectPage.module.css';

/** What a new agent may do until the user says otherwise — the same defaults the server uses. */
const DEFAULT_PERMISSIONS: AgentPermission[] = ['read', 'add'];

/**
 * Auth0 sends the user here mid-sign-in (see deploy/auth0) so they choose what an AI assistant
 * may do. "Allow" saves the choice and hands the sign-in back to Auth0; "Cancel" refuses it.
 */
export default function AgentConnectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('session_token') ?? '';
  const state = params.get('state') ?? '';
  const { data: request, isLoading, isError } = useConnectRequest(token);
  const { data: boards } = useBoards();
  const authorize = useAuthorizeAgent();

  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [chosenBoards, setChosenBoards] = useState<string[] | null>(null);
  // Personal boards unless the user picks otherwise; a shared board is an explicit opt-in.
  const boardIds = chosenBoards ?? boards?.filter((b) => !b.shared).map((b) => b.id) ?? [];

  // Already approved earlier: nothing to ask, carry on with the sign-in.
  useEffect(() => {
    if (request?.alreadyConnected && state) window.location.replace(agentContinueUrl(state));
  }, [request, state]);

  if (!token || !state || isError) {
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

        <PermissionsEditor
          agentName={request.name}
          permissions={permissions}
          boardIds={boardIds}
          onPermissionsChange={setPermissions}
          onBoardsChange={setChosenBoards}
        />

        {authorize.isError && <p role="alert">{t('board.actionFailed')}</p>}
        <div className={styles.actions}>
          <Button
            variant="primary"
            disabled={authorize.isPending || boardIds.length === 0}
            onClick={() =>
              authorize.mutate(
                { token, permissions, boardIds },
                { onSuccess: () => window.location.replace(agentContinueUrl(state)) }
              )
            }
          >
            {t('agents.connectPage.allow')}
          </Button>
          <Button variant="ghost" onClick={() => window.location.replace(agentContinueUrl(state, 'deny'))}>
            {t('board.cancel')}
          </Button>
        </div>
        {boardIds.length === 0 && <p className={styles.hint}>{t('agents.connectPage.pickBoard')}</p>}
      </div>
    </div>
  );
}
