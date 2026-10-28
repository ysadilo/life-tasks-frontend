import { agentInitials } from '../../lib/agents';
import styles from './agents.module.css';

export function AgentAvatar({ name }: { name: string }) {
  return (
    <span className={styles.avatar} aria-hidden>
      {agentInitials(name)}
    </span>
  );
}
