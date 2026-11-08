/** Bell glyph marking a task that has a reminder; sized to sit inside a Chip or beside text. */
export function ReminderIcon({ title }: { title?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ flex: 'none', verticalAlign: '-2px' }}
    >
      {title && <title>{title}</title>}
      <path d="M4 11.5V7.5a4 4 0 0 1 8 0v4l1 1H3l1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 14h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
