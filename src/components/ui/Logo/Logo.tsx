interface LogoProps {
  className?: string;
}

/** "Horizon and list" mark with the LIFE/TASKS wordmark. Lines and text follow `color`; the sun is the acid accent. */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      width="60"
      height="69"
      viewBox="20 15 80 92"
      fill="none"
      role="img"
      aria-label="LifeTasks"
    >
      <path d="M49 33 A11 11 0 0 1 71 33 Z" fill="var(--color-active)" />
      <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round">
        <path d="M49 33 A11 11 0 0 1 71 33" />
        <line x1="23" y1="33" x2="97" y2="33" />
        <line x1="38" y1="38.5" x2="82" y2="38.5" />
        <line x1="50" y1="44" x2="70" y2="44" />
      </g>
      <g fill="currentColor" fontFamily="Mulish, sans-serif" fontWeight="300" fontSize="24">
        <text x="23.3" y="75" textLength="73.4" lengthAdjust="spacing">
          LIFE
        </text>
        <text x="23.3" y="101">
          TASKS
        </text>
      </g>
    </svg>
  );
}
