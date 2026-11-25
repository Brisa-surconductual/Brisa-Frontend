import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/Button/index.js';

const CURRENT_CONTENT_PATH = '/app/estudiante/cronograma/contenido-vigente';

/*
 * Variante compacta del acceso al contenido vigente para el inicio.
 * Recibe el estado de `useCurrentContents` (la misma consulta de la
 * tarjeta completa, sin otra petición). Solo lo que entrega la API:
 * nombre, unidad temporal y «Vigente»; sin porcentajes ni fechas. El
 * detalle del cronograma vive en la pantalla de contenido vigente.
 */
export function CompactCurrentContent({ currentContent, loading, loadError, retry }) {
  return (
    <section
      aria-labelledby="contenido-actual-titulo"
      aria-busy={loading}
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <CalendarDays size={20} strokeWidth={1.8} />
        </span>

        <h2
          id="contenido-actual-titulo"
          className="m-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold text-[var(--text-primary)]"
        >
          Tu contenido actual
        </h2>
      </div>

      {loading ? (
        <div>
          <p role="status" className="sr-only">
            Consultando contenido vigente...
          </p>
          <div
            className="h-[56px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-hover)] motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
      ) : loadError ? (
        <div className="flex flex-col gap-[var(--space-3)]">
          <p
            role="alert"
            className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold text-[var(--danger-text)]"
          >
            <AlertTriangle size={18} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
            {loadError}
          </p>
          <Button variant="secondary" onClick={retry} className="self-start">
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : currentContent.length ? (
        <ul
          aria-label="Contenido vigente"
          className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0"
        >
          {currentContent.map((item) => (
            <li
              key={item.associationId}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-3)] py-[var(--space-2)]"
            >
              <BookOpen
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--brand-600)]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <strong className="block text-[length:var(--font-size-sm)] [overflow-wrap:anywhere] text-[var(--text-primary)]">
                  {item.name}
                </strong>
                {item.temporalUnitName && (
                  <span className="block text-[length:var(--font-size-xs)] [overflow-wrap:anywhere] text-[var(--text-secondary)]">
                    {item.temporalUnitName}
                  </span>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--brand-700)]">
                <CircleDot size={12} strokeWidth={2} aria-hidden="true" />
                Vigente
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          No hay contenido vigente para tu avance actual.
        </p>
      )}

      {/* Acción secundaria: la principal del inicio es el chat. */}
      <Link
        to={CURRENT_CONTENT_PATH}
        className="mt-auto inline-flex min-h-[44px] items-center justify-center gap-[var(--space-2)] self-start rounded-[var(--radius-md)] border-[1.5px] border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] no-underline shadow-[var(--shadow-sm)] transition-colors duration-150 hover:border-[var(--button-secondary-hover-border)] hover:bg-[var(--button-secondary-hover-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)] motion-reduce:transition-none"
      >
        Ver contenido vigente
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </Link>
    </section>
  );
}
