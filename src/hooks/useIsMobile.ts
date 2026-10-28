import { useSyncExternalStore } from 'react';

/** The breakpoint the stylesheets switch to the phone layout at. */
export const MOBILE_QUERY = '(max-width: 768px)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** True on a phone-width viewport; for layouts that differ in structure, not just styling. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches);
}
