import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthTokenGetter } from './authToken';

/** Bridges Auth0's `getAccessTokenSilently` into the module-level `api` client. Renders nothing. */
export function Auth0TokenBridge() {
  const { getAccessTokenSilently, loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isAuthenticated) return null;
      try {
        return await getAccessTokenSilently();
      } catch {
        // Silent renewal failed (expired/revoked refresh token) — send the user back through login.
        await loginWithRedirect({ appState: { returnTo: window.location.pathname } });
        return null;
      }
    });
    return () => setAuthTokenGetter(async () => null);
  }, [getAccessTokenSilently, loginWithRedirect, isAuthenticated]);

  return null;
}
