import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLandingPage.module.css';

type Mode = 'login' | 'signup';

/**
 * Auth0 uses redirect-based Universal Login, so there's no embedded form — this
 * is the split-panel landing from mockup 01 with a CTA that hands off to Auth0.
 */
export function AuthLandingPage({ mode }: { mode: Mode }) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const { t } = useTranslation();
  const location = useLocation();

  if (!isLoading && isAuthenticated) return <Navigate to="/today" replace />;

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/today';
  const start = (hint: Mode) =>
    loginWithRedirect({
      appState: { returnTo },
      authorizationParams: hint === 'signup' ? { screen_hint: 'signup' } : {},
    });

  return (
    <AuthLayout>
      <div className={styles.panel}>
        <h2 className={styles.title}>{t(`auth.${mode}.title`)}</h2>
        <p className={styles.subtitle}>{t(`auth.${mode}.subtitle`)}</p>
        <Button variant="primary" className={styles.cta} onClick={() => start(mode)} disabled={isLoading}>
          {t(`auth.${mode}.cta`)}
        </Button>
        <button type="button" className={styles.alt} onClick={() => start(mode === 'login' ? 'signup' : 'login')}>
          {t(`auth.${mode}.alt`)}
        </button>
      </div>
    </AuthLayout>
  );
}
