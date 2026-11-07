/*
 * Isotipo de Brisa (la corriente con su punto), tomado de
 * public/brisa-identidad/06-loader-animado.svg. Los colores salen
 * de los tokens; el pulso solo corre si la persona no pidió menos
 * movimiento.
 */
export function BrisaMark({ pulse = false }) {
  return (
    <svg
      viewBox="0 0 30 32"
      width="64"
      height="68"
      aria-hidden="true"
      focusable="false"
      className={`text-[var(--brand-700)] ${pulse ? 'motion-safe:animate-pulse' : ''}`}
    >
      <path
        d="M4 22C7 21 9 18 11 19C13 20 14 15 17 13C19.5 11.3 21 11.5 23 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="23" cy="10" r="3" fill="var(--brand-300)" />
    </svg>
  );
}
