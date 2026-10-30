import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { BottomNav } from '../BottomNav';
import { QuickAddModal, TaskFormPanel, TaskPreviewPanel } from '../../task';
import { LifeAreasModal } from '../../lifeAreas';
import { BoardBar, InviteModal, NewBoardModal } from '../../board';
import { SamoyedPeek, Toaster } from '../../ui';
import { useHandedTaskPeek } from '../../../hooks/useHandedTaskPeek';
import { useOpenTaskFromUrl } from '../../../hooks/useOpenTaskFromUrl';
import { useSyncPushSubscription } from '../../../hooks/usePushNotifications';
import styles from './AppShell.module.css';

export function AppShell() {
  useSyncPushSubscription();
  useHandedTaskPeek();
  useOpenTaskFromUrl();
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
      <QuickAddModal />
      <LifeAreasModal />
      <NewBoardModal />
      <InviteModal />
      <Toaster />
      <SamoyedPeek />
    </div>
  );
}
