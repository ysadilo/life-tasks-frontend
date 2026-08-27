import styles from './PageState.module.css';

export function PageState({ children }: { children: string }) {
  return <div className={styles.state}>{children}</div>;
}
