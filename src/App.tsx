import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Backlog from './pages/Backlog';
import Today from './pages/Today';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <NavLink to="/today">Today</NavLink>
        <NavLink to="/backlog">Backlog</NavLink>
        <NavLink to="/calendar">Week / Month</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
    </div>
  );
}
