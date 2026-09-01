import { useSyncExternalStore } from 'react';

interface Toast {
  id: number;
  message: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

export const toast = {
  show(message: string) {
    const id = nextId++;
    toasts = [...toasts, { id, message }];
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
