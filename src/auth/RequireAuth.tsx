import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
import { PageState } from '../components/layout';

/** Route guard: waits for Auth0, then sends signed-out visitors to the sign-in page. */
export function RequireAuth() {
  const { isLoading, isAuthenticated } = useAuth0();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) return <PageState>{t('auth.loading')}</PageState>;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace state={{ returnTo: location.pathname }} />;
  return <Outlet />;
}
