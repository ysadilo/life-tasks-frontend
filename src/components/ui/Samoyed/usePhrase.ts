import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MomentId } from '../../../lib/samoyed';

const lastPick = new Map<MomentId, string>();

const asList = (raw: unknown) => (Array.isArray(raw) ? (raw as string[]) : [raw as string]);

/**
 * A random phrase for the moment, never the same one twice in a row. `name` fills {{name}} (who handed the task);
 * `withTriage` adds the `<moment>Triage` phrases, which only make sense while there is a triage queue.
 */
export function usePhrase(moment: MomentId, name?: string, withTriage = false): string {
  const { t } = useTranslation();
  return useMemo(() => {
    const get = (key: string) => asList(t(`samoyed.phrases.${key}`, { returnObjects: true, name }));
    const options = withTriage ? [...get(moment), ...get(`${moment}Triage`)] : get(moment);
    const pool = options.length > 1 ? options.filter((p) => p !== lastPick.get(moment)) : options;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastPick.set(moment, pick);
    return pick;
  }, [t, moment, name, withTriage]);
}
