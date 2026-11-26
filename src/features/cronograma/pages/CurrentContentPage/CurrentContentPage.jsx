import { useCurrentContents } from '../../hooks/useCurrentContents.js';
import { AssignedScheduleSummary } from '../../components/AssignedScheduleSummary/AssignedScheduleSummary.jsx';

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, RefreshCw } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';

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
    <div className="flex w-full flex-col gap-[var(--space-5)] md:gap-[var(--space-6)]">
      <BackButton onClick={handleBack}>Volver al inicio</BackButton>

      <SchedulePageHeader
        eyebrow="Tu programa"
        title="Contenido vigente"
        description="Consulta el contenido que se encuentra disponible actualmente dentro de tu cronograma."
      />

      <AssignedScheduleSummary />

      <section
        aria-labelledby="contenidos-disponibles-titulo"
        aria-busy={loading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div className="flex items-baseline justify-between gap-[var(--space-3)]">
          <h2
            id="contenidos-disponibles-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Disponible ahora
          </h2>

          {!loading && !loadError && currentContent.length > 0 && (
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
              {currentContent.length}{' '}
              {currentContent.length === 1 ? 'contenido' : 'contenidos'}
            </p>
          )}
        </div>

        {loading ? (
          <>
            <p role="status" className="sr-only">
              Cargando contenido vigente...
            </p>
            <div className="flex flex-col gap-[var(--space-3)]" aria-hidden="true">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="h-[150px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                />
              ))}
            </div>
          </>
        ) : loadError ? (
          <PanelNotice
            tone="danger"
            icon={AlertTriangle}
            title="No pudimos mostrar tu contenido"
            role="alert"
            action={
              <Button variant="secondary" onClick={retry}>
                <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
                Reintentar consulta
              </Button>
            }
          >
            {loadError}
          </PanelNotice>
        ) : currentContent.length > 0 ? (
          <ul
            className="m-0 grid list-none gap-[var(--space-4)] p-0 lg:grid-cols-2"
            aria-label="Contenido vigente"
          >
            {currentContent.map((content) => (
              <li key={content.associationId ?? content.id} className="flex [&>article]:flex-1">
                <CurrentContentCard
                  content={content}
                  onSelect={onSelectContent}
                  headingLevel={3}
                />
              </li>
            ))}
          </ul>
        ) : (
          <PanelNotice
            tone="neutral"
            icon={CalendarClock}
            title="No hay contenido vigente"
            role="status"
          >
            El contenido aparecerá cuando su ventana coincida con tu avance
            individual. Se consulta el cronograma que tienes asignado, que
            puede ser distinto del base vigente para nuevos estudiantes.
          </PanelNotice>
        )}
      </section>
    </div>
  );
}
