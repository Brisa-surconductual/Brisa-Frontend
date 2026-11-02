import { useCurrentContents } from '../../hooks/useCurrentContents.js';
import { AssignedScheduleSummary } from '../../components/AssignedScheduleSummary/AssignedScheduleSummary.jsx';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Encabezado, navegación y cierre de sesión los aporta el
 * StudentLayout. Aquí solo el contenido vigente.
 */
export function CurrentContentPage({ onSelectContent }) {
  const navigate = useNavigate();

  const { currentContent, loading, loadError, retry } = useCurrentContents();

  function handleBack() {
    navigate('/app/estudiante');
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-[var(--space-5)]">
          <button
            type="button"
            className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-0 bg-transparent px-[var(--space-2)] text-[13px] font-semibold text-[var(--brand-600)] hover:underline"
            onClick={handleBack}
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            Volver al inicio
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Tu programa
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Contenido vigente
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta el contenido que se encuentra disponible actualmente
              dentro de tu cronograma.
            </p>
          </header>

          <AssignedScheduleSummary />

          {loading ? (
            <p
              className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando contenido vigente...
            </p>
          ) : loadError ? (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
              <div className="mt-[var(--space-3)]">
                <Button variant="secondary" onClick={retry}>
                  Reintentar consulta
                </Button>
              </div>
            </div>
          ) : currentContent.length > 0 ? (
            <section
              className="grid gap-[var(--space-4)]"
              aria-label="Contenido vigente"
            >
              {currentContent.map((content) => (
                <CurrentContentCard
                  key={content.associationId ?? content.id}
                  content={content}
                  onSelect={onSelectContent}
                />
              ))}
            </section>
          ) : (
            <EmptyScheduleState
              title="No hay contenido vigente"
              description="El contenido aparecerá cuando su ventana coincida con tu avance individual. Se consulta el cronograma que tienes asignado, que puede ser distinto del base vigente para nuevos estudiantes."
            />
          )}
      </div>
    </div>
  );
}
