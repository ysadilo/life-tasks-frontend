import { agentInitials } from '../../lib/agents';
import { colorFor } from '../board/boardColors';
import styles from './agents.module.css';

export function AgentAvatar({ name }: { name: string }) {
  return (
    <span className={styles.avatar} style={{ background: colorFor(name) }} aria-hidden>
      {agentInitials(name)}
    </span>
  );
}
