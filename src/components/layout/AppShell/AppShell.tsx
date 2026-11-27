import { Outlet, useMatch } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { BottomNav } from '../BottomNav';
import { QuickAddModal, TaskFormPanel, TaskPreviewPanel } from '../../task';
import { LifeAreasModal } from '../../lifeAreas';
import { InviteModal, NewBoardModal } from '../../board';
import { SamoyedPeek, Toaster } from '../../ui';
import { useHandedTaskPeek } from '../../../hooks/useHandedTaskPeek';
import { useOpenTaskFromUrl } from '../../../hooks/useOpenTaskFromUrl';
import { useSyncPushSubscription } from '../../../hooks/usePushNotifications';
import styles from './AppShell.module.css';

export function AppShell() {
  useSyncPushSubscription();
  useHandedTaskPeek();
  useOpenTaskFromUrl();
  // Triage is a focus mode (v7): no sidebar or tab bar, just the queue.
  const focus = useMatch('/triage') !== null;
  return (
    <div className={focus ? `${styles.shell} ${styles.focus}` : styles.shell}>
      {!focus && <Sidebar />}
      <div className={styles.canvas}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <TaskFormPanel />
        <TaskPreviewPanel />
      </div>
      {!focus && <BottomNav />}
      <QuickAddModal />
      <LifeAreasModal />
      <NewBoardModal />
      <InviteModal />
      <Toaster />
      <SamoyedPeek />
    </div>
  );
}
