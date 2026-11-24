import { Phone } from 'lucide-react';

import { enlaceTelefono } from '../../../../services/sos/respuestaSos.js';

/*
 * RF-43: líneas de ayuda que envió el backend al activar. Se muestran tal
 * cual: ni nombres ni números propios. Solo un número marcable lleva
 * enlace `tel:`.
 */
export function SupportResources({ recursos }) {
  if (!recursos?.length) return null;

  return (
    <section
      aria-labelledby="sos-recursos-titulo"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]"
    >
      <h2
        id="sos-recursos-titulo"
        className="m-0 text-[length:var(--font-size-base)] font-extrabold text-[var(--text-primary)]"
      >
        Líneas de ayuda
      </h2>

      <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
        {recursos.map(({ nombre, telefono }, indice) => {
          const href = enlaceTelefono(telefono);

          return (
            // Los recursos no cambian de lugar: el índice es estable.
            <li key={indice}>
              {href ? (
                <a
                  href={href}
                  aria-label={`Llamar a ${nombre} al ${telefono}`}
                  className="flex min-h-[48px] items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-primary)] no-underline hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
                >
                  <Phone
                    size={20}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--brand-600)]"
                  />
                  <span className="flex flex-col">
                    <span className="font-bold">{nombre}</span>
                    <span className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                      {telefono}
                    </span>
                  </span>
                </a>
              ) : (
                <p className="m-0 flex min-h-[48px] flex-col justify-center rounded-[var(--radius-lg)] border border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-primary)]">
                  <span className="font-bold">{nombre}</span>
                  {telefono && (
                    <span className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                      {telefono}
                    </span>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
