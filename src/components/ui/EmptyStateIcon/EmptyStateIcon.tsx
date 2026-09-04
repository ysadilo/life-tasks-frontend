/** Generic "empty tray" glyph shown atop an EmptyState. Inherits color from its parent via currentColor. */
export function EmptyStateIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 11h5.5a1 1 0 0 1 .9.55l.7 1.4a1 1 0 0 0 .9.55h3.5a1 1 0 0 0 .77-.36l1.13-1.36" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
    </svg>
  );
}
