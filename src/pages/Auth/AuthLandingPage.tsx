import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth0, type RedirectLoginOptions } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
import { Button, Logo } from '../../components/ui';
import { timeOfDay } from '../../lib/timeOfDay';
import { HorizonSky } from './HorizonSky';
import styles from './AuthLandingPage.module.css';

type Mode = 'login' | 'signup';
type AuthParams = RedirectLoginOptions['authorizationParams'];

/**
 * Sign in / sign up (v7 mockup 01). Auth0 Universal Login owns the password step, so the
 * email here is passed on as `login_hint` and Google goes straight to its connection.
 */
export function AuthLandingPage({ mode }: { mode: Mode }) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const { t } = useTranslation();
  const location = useLocation();

  if (!isLoading && isAuthenticated) return <Navigate to="/today" replace />;

  const when = timeOfDay(new Date().getHours());
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/today';
  const start = (params: AuthParams) => loginWithRedirect({ appState: { returnTo }, authorizationParams: params });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    start({
      ...(mode === 'signup' && { screen_hint: 'signup' }),
      ...(email && { login_hint: email }),
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <HorizonSky when={when} />
        <header className={styles.top}>
          <Logo className={styles.logo} />
          <span className={styles.switch}>
            {t(`auth.${mode}.switchPrompt`)}{' '}
            <Link to={mode === 'login' ? '/sign-up' : '/sign-in'} state={location.state}>
              {t(`auth.${mode}.switchLink`)}
            </Link>
          </span>
        </header>
        <div className={styles.greeting}>
          <h1 className={styles.title}>{t(`auth.greeting.${when}`)}</h1>
          <p className={styles.subtitle}>{mode === 'login' ? t(`auth.tagline.${when}`) : t('auth.signup.subtitle')}</p>
        </div>
      </section>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          {t('auth.email')}
          <input type="email" name="email" autoComplete="email" className={styles.input} />
        </label>
        <Button variant="primary" type="submit" className={styles.cta} disabled={isLoading}>
          {t(`auth.${mode}.cta`)}
        </Button>
        <div className={styles.or}>{t('auth.or')}</div>
        <button
          type="button"
          className={styles.google}
          onClick={() => start({ connection: 'google-oauth2' })}
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          {t('auth.google')}
        </button>
      </form>

      <p className={styles.footer}>{t('auth.footer')}</p>
    </div>
  );
}
