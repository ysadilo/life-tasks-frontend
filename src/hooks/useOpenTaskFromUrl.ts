import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { taskForm } from '../components/task';
import { api } from '../lib/api';
import type { Task } from '../models';

/** `?task=<id>` (activity links, push clicks) opens that task; a deleted task just drops the param. */
export function useOpenTaskFromUrl() {
  const [params, setParams] = useSearchParams();
  const id = params.get('task');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<Task>(`/tasks/${id}`)
      .then((task) => !cancelled && taskForm.openView(task))
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        setParams(
          (p) => {
            p.delete('task');
            return p;
          },
          { replace: true }
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, setParams]);
}
