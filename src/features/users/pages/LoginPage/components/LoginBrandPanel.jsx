/*
 * Panel de identidad del login (solo escritorio). Decoración con
 * CSS y SVG en `currentColor`: sin imágenes ni colores fijos.
 *
 * Usa una marca propia en lugar de BrisaLogo porque este último
 * pinta el nombre con --text-primary, ilegible sobre el panel.
 */
function BrandMark() {
  return (
    <span className="inline-flex items-center gap-[var(--space-3)]">
      <span
        className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--surface-brand-line)] bg-[var(--surface-brand-raised)] text-[var(--text-on-brand)]"
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <path
            d="M6 22 C9 21, 11 18, 13 19 C15 20, 16 15, 19 13 C21.5 11.3, 23 11.5, 25 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="25" cy="10" r="2.3" fill="currentColor" />
        </svg>
      </span>

      <span className="text-[length:var(--font-size-xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)]">
        Brisa
      </span>
    </span>
  );
}

/*
 * Líneas de brisa: eco del trazo del logo. Ocupan el espacio libre
 * entre la marca y el texto, sin cruzar el contenido legible.
 */
function BreezeLines() {
  return (
    <svg
      className="pointer-events-none absolute top-[22%] right-0 w-[85%] max-w-[460px] text-[var(--text-on-brand-muted)] opacity-25"
      viewBox="0 0 400 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 190 C70 180, 110 140, 160 150 C210 160, 230 100, 290 80 C330 66, 360 70, 395 55"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 214 C100 206, 140 172, 190 180 C240 188, 262 136, 320 118 C350 109, 372 112, 398 102"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M90 236 C140 230, 176 204, 220 210 C262 216, 284 178, 330 164 C356 156, 376 158, 398 150"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoginBrandPanel() {
  return (
    <aside
      className="relative hidden overflow-hidden bg-[var(--surface-brand)] p-[var(--space-9)] text-[var(--text-on-brand)] lg:flex lg:flex-col lg:justify-between"
      aria-label="Sobre Brisa"
    >
      <span
        className="pointer-events-none absolute -top-[120px] -right-[120px] h-[360px] w-[360px] rounded-[var(--radius-full)] bg-[radial-gradient(circle,var(--surface-brand-raised)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <BreezeLines />

      <div className="relative">
        <BrandMark />
      </div>

      <div className="relative flex max-w-[400px] flex-col gap-[var(--space-4)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-on-brand-muted)] uppercase">
          Apoyo psicoeducativo
        </p>

        <p className="m-0 text-[length:var(--font-size-3xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)]">
          Un espacio tranquilo para avanzar a tu ritmo.
        </p>

        <p className="m-0 text-[length:var(--font-size-base)] leading-[var(--line-height-relaxed)] text-[var(--text-on-brand-muted)]">
          Brisa te acompaña en tu proceso para dejar el vapeo, con
          contenidos pensados para tu vida universitaria.
        </p>
      </div>
    </aside>
  );
}
