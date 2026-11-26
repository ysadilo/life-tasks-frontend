import { useSearchParams } from 'react-router-dom';
import type { LifeAreaId } from '../models';

const PARAM = 'area';

/** Backlog's life-area filter, kept in the URL (`?area=…&area=…`) so the sidebar's area list can drive it. */
export function useAreaFilter() {
  const [params, setParams] = useSearchParams();
  const areaIds: LifeAreaId[] = params.getAll(PARAM);

  const setAreaIds = (ids: LifeAreaId[]) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PARAM);
        ids.forEach((id) => next.append(PARAM, id));
        return next;
      },
      { replace: true }
    );

  const toggle = (id: LifeAreaId) =>
    setAreaIds(areaIds.includes(id) ? areaIds.filter((a) => a !== id) : [...areaIds, id]);

  return { areaIds, setAreaIds, toggle };
}
