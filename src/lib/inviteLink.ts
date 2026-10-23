import { toast } from '../components/ui/Toast';

export const inviteUrl = (code: string) => `${window.location.origin}/join/${code}`;

/** Copies a board's join link; `message` / `failed` are the toasts for each outcome. */
export async function copyInviteLink(code: string, message: string, failed: string) {
  try {
    await navigator.clipboard.writeText(inviteUrl(code));
    toast.show(message);
  } catch {
    toast.show(failed);
  }
}
