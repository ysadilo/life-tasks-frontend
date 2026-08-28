import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthTokenGetter } from './authToken';

/** Bridges Auth0's `getAccessTokenSilently` into the module-level `api` client. Renders nothing. */
export function Auth0TokenBridge() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    setAuthTokenGetter(async () => (isAuthenticated ? getAccessTokenSilently() : null));
    return () => setAuthTokenGetter(async () => null);
  }, [getAccessTokenSilently, isAuthenticated]);

  return null;
}
