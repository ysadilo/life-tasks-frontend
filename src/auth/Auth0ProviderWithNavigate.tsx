import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth0Provider, type AppState } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId || !audience) {
  throw new Error('Missing VITE_AUTH0_* env vars — copy .env.example to .env and fill them in.');
}

/** Auth0Provider wired to react-router so post-login redirects stay client-side. */
export function Auth0ProviderWithNavigate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      useRefreshTokens
      authorizationParams={{ redirect_uri: window.location.origin, audience }}
      onRedirectCallback={(appState?: AppState) => navigate(appState?.returnTo ?? '/', { replace: true })}
    >
      {children}
    </Auth0Provider>
  );
}
