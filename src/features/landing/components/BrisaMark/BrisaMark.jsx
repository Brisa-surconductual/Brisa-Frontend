/**
 * Isotipo REAL de Brisa (public/brisa-identidad): onda con un punto sobre
 * cuadro verde de marca. Con `animated` la onda se mece y el punto late,
 * como la animación de carga de la identidad. Solo transform y opacity.
 */
export function BrisaMark({ size = 32, animated = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`${animated ? 'lp-mark--live' : ''} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width="32"
        height="32"
        rx="7"
        fill="var(--brand-700)"
      />
      <g transform="translate(1.8 .7)">
        <path
          className="lp-mark__wave"
          d="M4 22C7 21 9 18 11 19C13 20 14 15 17 13C19.5 11.3 21 11.5 23 10"
          fill="none"
          stroke="var(--neutral-0)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          className="lp-mark__dot"
          cx="23"
          cy="10"
          r="3"
          fill="var(--neutral-0)"
        />
      </g>
    </svg>
  );
}
