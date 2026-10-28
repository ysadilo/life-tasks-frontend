import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MomentId } from '../../../lib/samoyed';

const lastPick = new Map<MomentId, string>();

/** A random phrase for the moment, never the same one twice in a row. `name` fills {{name}} (who handed the task). */
export function usePhrase(moment: MomentId, name?: string): string {
  const { t } = useTranslation();
  return useMemo(() => {
    const raw = t(`samoyed.phrases.${moment}`, { returnObjects: true, name }) as unknown as string | string[];
    const options = Array.isArray(raw) ? raw : [raw];
    const pool = options.length > 1 ? options.filter((p) => p !== lastPick.get(moment)) : options;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastPick.set(moment, pick);
    return pick;
  }, [t, moment, name]);
}
