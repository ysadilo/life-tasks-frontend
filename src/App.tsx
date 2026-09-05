import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/layout';
import { RequireAuth } from './auth/RequireAuth';
import { AuthLandingPage } from './pages/Auth';
import Backlog from './pages/Backlog';
import Today from './pages/Today';
import Triage from './pages/Triage';
import CalendarPage from './pages/Calendar';

export default function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  return (
    <Routes>
      <Route path="/sign-in" element={<AuthLandingPage mode="login" />} />
      <Route path="/sign-up" element={<AuthLandingPage mode="signup" />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/calendar" element={<Navigate to="/calendar/week" replace />} />
          <Route path="/calendar/:view" element={<CalendarPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
