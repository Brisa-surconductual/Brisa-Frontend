/**
 * Fondo atmosférico (aurora): tres manchas de color que se desplazan muy
 * despacio. Solo `transform`; se pausa fuera de viewport (ver .lp-anim).
 */
export function LandingBackdrop({ className = '' }) {
  return (
    <div
      className={`lp-aurora ${className}`}
      aria-hidden="true"
    >
      <span className="lp-aurora__blob lp-aurora__blob--a lp-anim" />
      <span className="lp-aurora__blob lp-aurora__blob--b lp-anim" />
      <span className="lp-aurora__blob lp-aurora__blob--c lp-anim" />
      <span className="lp-aurora__veil" />
    </div>
  );
}
