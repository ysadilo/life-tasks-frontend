import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { BottomNav } from '../BottomNav';
import { TaskFormModal } from '../../task';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
      <TaskFormModal />
    </div>
  );
}
