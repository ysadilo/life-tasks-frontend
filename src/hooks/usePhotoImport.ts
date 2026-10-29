import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { resizeImage } from '../lib/resizeImage';
import { localISODate } from '../lib/dateUtils';
import type { TaskDraft } from '../lib/quickAdd';
import type { Energy, LifeAreaId, Priority, Recurrence } from '../models';

/** What POST /tasks/from-photo returns for each task it found. */
interface PhotoDraft {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority | null;
  energy: Energy | null;
  estimatedMinutes: number | null;
  areaId: LifeAreaId | null;
  recurrence: Recurrence | null;
}

/** Reads a photo into task drafts for the New task form; nothing is created or stored. */
export function usePhotoImport() {
  return useMutation({
    mutationFn: async (file: File): Promise<TaskDraft[]> => {
      const form = new FormData();
      form.append('photo', await resizeImage(file), 'photo.jpg');
      const { tasks } = await api.postForm<{ tasks: PhotoDraft[] }>(`/tasks/from-photo?today=${localISODate()}`, form);
      return tasks.map(({ estimatedMinutes, ...draft }) => ({ ...draft, minutes: estimatedMinutes }));
    },
  });
}
