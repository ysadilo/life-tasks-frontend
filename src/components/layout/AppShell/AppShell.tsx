import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { BottomNav } from '../BottomNav';
import { TaskFormPanel, TaskPreviewPanel } from '../../task';
import { LifeAreasModal } from '../../lifeAreas';
import { BoardBar, InviteModal, NewBoardModal } from '../../board';
import { SamoyedPeek, Toaster } from '../../ui';
import { useSyncPushSubscription } from '../../../hooks/usePushNotifications';
import styles from './AppShell.module.css';

export function AppShell() {
  useSyncPushSubscription();
  return (
    <div className={styles.shell}>
      <Sidebar />
      <BoardBar />
      <div className={styles.canvas}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <TaskFormPanel />
        <TaskPreviewPanel />
      </div>
      <BottomNav />
      <LifeAreasModal />
      <NewBoardModal />
      <InviteModal />
      <Toaster />
      <SamoyedPeek />
    </div>
  );
}
