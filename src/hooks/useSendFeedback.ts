import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NewFeedbackInput } from '../models';

/** The BE turns each submission into a GitHub issue (the token must stay server-side). */
export function useSendFeedback() {
  return useMutation({
    mutationFn: (input: NewFeedbackInput) => api.post<void>('/feedback', input),
  });
}
