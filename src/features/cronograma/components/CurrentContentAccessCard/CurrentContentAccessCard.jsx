import { AssignedScheduleSummary } from '../AssignedScheduleSummary/AssignedScheduleSummary.jsx';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrentContents } from '../../hooks/useCurrentContents.js';
import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Acceso al contenido vigente desde el inicio. Muestra solo lo
 * que entrega la API: sin porcentajes ni actividades completadas.
 */
export function CurrentContentAccessCard() {
  const { currentContent, loading, loadError, retry } = useCurrentContents();
  return (
    <section
      aria-labelledby="contenido-actual-titulo"
      aria-busy={loading}
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
    >
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <CalendarDays size={22} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <h2
            id="contenido-actual-titulo"
            className="m-0 text-[length:var(--font-size-xl)] leading-[var(--line-height-snug)] font-extrabold text-[var(--text-primary)]"
          >
            Tu contenido actual
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            Consulta el contenido disponible actualmente dentro de tu
            cronograma.
          </p>
        </div>
      </div>

      <AssignedScheduleSummary />

      {loading ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <p role="status" className="sr-only">
            Consultando contenido vigente...
          </p>
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-[60px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-hover)] motion-reduce:animate-none"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : loadError ? (
        <p
          role="alert"
          className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold text-[var(--danger-text)]"
        >
          <AlertTriangle size={18} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
          {loadError}
        </p>
      ) : currentContent.length ? (
        <ul
          aria-label="Contenido vigente"
          className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0"
        >
          {currentContent.map((item) => (
            <li
              key={item.associationId}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <BookOpen
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--brand-600)]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <strong className="block text-[length:var(--font-size-md)] [overflow-wrap:anywhere] text-[var(--text-primary)]">
                  {item.name}
                </strong>
                <span className="block text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                  {item.temporalUnitName}
                </span>
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
          No hay contenido vigente para tu avance actual. La disponibilidad
          se calcula desde tu fecha individual de inicio, dentro del
          cronograma que tienes asignado.
        </p>
      )}

      <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" disabled={loading} onClick={retry}>
          <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          Actualizar contenido
        </Button>

        <Link
          to="/app/estudiante/cronograma/contenido-vigente"
          className="inline-flex min-h-[44px] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--brand-500)] px-[var(--space-5)] text-[length:var(--font-size-md)] font-bold text-[var(--button-primary-text)] no-underline transition-colors duration-150 hover:bg-[var(--brand-600)] [html[data-theme=dark]_&]:hover:bg-[var(--brand-400)] motion-reduce:transition-none"
        >
          Ver contenido vigente
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
