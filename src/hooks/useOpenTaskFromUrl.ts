import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { taskForm } from '../components/task';
import { api } from '../lib/api';
import { getActiveBoardId } from '../lib/activeBoard';
import type { Task } from '../models';
import { useSwitchBoard } from './useBoards';

/**
 * `?task=<id>` (activity links, push clicks) opens that task; a deleted task just drops the param.
 * `&board=<id>` (push clicks) switches to the task's board first, since task lookups are board-scoped.
 */
export function useOpenTaskFromUrl() {
  const [params, setParams] = useSearchParams();
  const switchBoard = useSwitchBoard();
  const id = params.get('task');
  const boardId = params.get('board');

  useEffect(() => {
    if (!id) return;
    if (boardId && boardId !== getActiveBoardId()) switchBoard(boardId);
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
            p.delete('board');
            return p;
          },
          { replace: true }
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, boardId, setParams]);
}
