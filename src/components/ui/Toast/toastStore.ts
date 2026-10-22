import { useSyncExternalStore } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

export const toast = {
  show(message: string, action?: ToastAction) {
    const id = nextId++;
    toasts = [...toasts, { id, message, action }];
    emit();
    setTimeout(() => toast.dismiss(id), 4500);
  },
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
};

export function useToasts() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => toasts
  );
}
