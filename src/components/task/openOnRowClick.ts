import type { MouseEvent } from 'react';

const INTERACTIVE = 'button, input, select, textarea, a, label';

/** Click handler that opens a row's details, unless the click landed on one of the row's own controls. */
export function openOnRowClick(onOpen?: () => void) {
  if (!onOpen) return undefined;
  return (e: MouseEvent) => {
    if (!(e.target as Element).closest(INTERACTIVE)) onOpen();
  };
}
