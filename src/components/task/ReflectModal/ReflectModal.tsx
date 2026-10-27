import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { formatMinutes } from '../../../lib/taskMeta';
import type { Feeling, Task } from '../../../models';
import styles from './ReflectModal.module.css';

export interface Reflection {
  feeling?: Feeling;
  actualMinutes?: number;
}

interface ReflectModalProps {
  /** The task being finished (or, with `done`, already finished); the modal is closed while null. */
  task: Task | null;
  /** Reflecting on a finished task: starts from its saved check-in and offers Save instead of the done buttons. */
  done?: boolean;
  onClose: () => void;
  /** Called with an empty reflection for "Just mark done". */
  onSubmit: (task: Task, reflection: Reflection) => void;
}

const FEELINGS: Feeling[] = ['drained', 'heavy', 'neutral', 'good', 'great'];
const TOOK_MINUTES = [30, 60, 120, 180];

/** Check-in for a task: how it felt and how long it took, both optional (mockup 03). */
export function ReflectModal({ task, done = false, onClose, onSubmit }: ReflectModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={task != null} onClose={onClose} title={t('reflect.title')} closeLabel={t('taskForm.close')}>
      {task && <ReflectForm key={task.id} task={task} done={done} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

function ReflectForm({
  task,
  done,
  onClose,
  onSubmit,
}: {
  task: Task;
  done: boolean;
  onClose: () => void;
  onSubmit: ReflectModalProps['onSubmit'];
}) {
  const { t } = useTranslation();
  const [feeling, setFeeling] = useState<Feeling | undefined>(done ? (task.feeling ?? undefined) : undefined);
  const [minutes, setMinutes] = useState<number | undefined>(done ? (task.actualMinutes ?? undefined) : undefined);

  // Re-click clears, like OptionGroup's single-select.
  const pick = <T,>(current: T | undefined, value: T) => (current === value ? undefined : value);

  return (
    <div className={styles.form}>
      <p className={styles.taskTitle}>{task.title}</p>

      <div className={styles.field}>
        <div className={styles.fieldHead}>
          <span className={styles.label}>{t('reflect.feelLabel')}</span>
          <span className={styles.optional}>{t('reflect.optional')}</span>
        </div>
        <div className={styles.feelings}>
          {FEELINGS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={feeling === value}
              className={`${styles.feeling} ${feeling === value ? styles.feelingSelected : ''}`}
              onClick={() => setFeeling((f) => pick(f, value))}
            >
              <span className={styles.swatch} style={{ background: `var(--reflect-${value})` }} />
              <span className={styles.feelingLabel}>{t(`reflect.feeling.${value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.took}>
        <span className={styles.optional}>{t('reflect.took')}</span>
        {TOOK_MINUTES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={minutes === value}
            className={`${styles.pill} ${minutes === value ? styles.pillSelected : ''}`}
            onClick={() => setMinutes((m) => pick(m, value))}
          >
            {formatMinutes(value)}
            {value === TOOK_MINUTES[TOOK_MINUTES.length - 1] && '+'}
          </button>
        ))}
        {task.estimatedMinutes != null && (
          <span className={styles.planned}>{t('reflect.planned', { time: formatMinutes(task.estimatedMinutes) })}</span>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          className={styles.action}
          onClick={done ? onClose : () => onSubmit(task, {})}
        >
          {done ? t('reflect.cancel') : t('reflect.justDone')}
        </Button>
        <Button
          type="button"
          variant="primary"
          className={styles.action}
          onClick={() => onSubmit(task, { feeling, actualMinutes: minutes })}
        >
          {done ? t('reflect.save') : t('reflect.saveDone')}
        </Button>
      </div>
    </div>
  );
}
