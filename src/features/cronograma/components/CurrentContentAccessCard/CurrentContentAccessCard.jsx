import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CurrentContentAccessCard() {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-100)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <CalendarDays
            size={20}
            strokeWidth={1.8}
          />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[15px] font-extrabold text-[var(--text-primary)] md:text-[17px]">
            Tu contenido actual
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.6] text-[var(--text-muted)] md:text-[13px]">
            Consulta el contenido disponible actualmente dentro de tu cronograma.
          </p>

          <Link
            to="/app/estudiante/cronograma/contenido-vigente"
            className="mt-[var(--space-4)] inline-flex items-center gap-[var(--space-2)] text-[12px] font-bold text-[var(--brand-600)] no-underline hover:underline md:text-[13px]"
          >
            Ver contenido vigente
            <ArrowRight
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}