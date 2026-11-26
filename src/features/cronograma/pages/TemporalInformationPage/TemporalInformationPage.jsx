import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CalendarOff, FileStack } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { TemporalInformationSummary } from '@/features/cronograma/components/TemporalInformationSummary/index.js';

import { obtenerContenidoVigenteUsuario } from '@/features/cronograma/api/contenidoVigente/obtenerContenidoVigenteUsuario.jsx';
import { obtenerUbicacionTemporalParticipante } from '@/features/cronograma/api/contenidoVigente/obtenerUbicacionTemporalParticipante.jsx';

import { mapCurrentContent } from '@/features/cronograma/utils/currentContent.js';

const EMPTY_TEMPORAL_INFORMATION = null;
const EMPTY_CURRENT_CONTENT = Object.freeze([]);

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatElapsedTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return '—';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return `${days} d ${hours} h`;
  }

  return `${hours} h`;
}

function mapTemporalInformation(participant) {
  if (!participant) {
    return null;
  }

  return {
    participantName: participant.correo_electronico,
    temporalUnitName: participant.nombre_unidad,
    temporalUnitOrder: participant.orden_unidad,
    calculationDateText: formatDate(
      participant.fecha_calculo,
    ),
    elapsedTimeText: formatElapsedTime(
      participant.tiempo_efectivo_transcurrido_segundos,
    ),
    completed:
      participant.cronograma_finalizado === true,
    message: participant.mensaje,
  };
}

export function TemporalInformationPage({
  onSelectContent,
}) {
  const navigate = useNavigate();

  const { participantId } = useParams();

  const [temporalInformation, setTemporalInformation] =
    useState(EMPTY_TEMPORAL_INFORMATION);

  const [currentContent, setCurrentContent] =
    useState(EMPTY_CURRENT_CONTENT);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadParticipantInformation() {
      if (!participantId) {
        setLoading(false);
        return;
      }

      try {
        const [participant, contents] =
          await Promise.all([
            obtenerUbicacionTemporalParticipante(
              participantId,
            ),
            obtenerContenidoVigenteUsuario(
              participantId,
            ),
          ]);

        if (!isMounted) {
          return;
        }

        setTemporalInformation(
          mapTemporalInformation(participant),
        );

        setCurrentContent(
          Array.isArray(contents)
            ? contents.map((content) => mapCurrentContent(content))
            : [],
        );
      } catch (error) {
          if (!isMounted) {
            return;
          }

          if (error.response?.status === 404) {
            setTemporalInformation(null);
            setCurrentContent([]);
            return;
          }

          setLoadError(
            'No pudimos consultar la información temporal del participante.',
          );
        } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadParticipantInformation();

    return () => {
      isMounted = false;
    };
  }, [participantId]);

  function handleBack() {
    navigate('/app/administrativo/cronograma/progreso');
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>Volver al progreso</BackButton>

      <SchedulePageHeader
        eyebrow="Progreso por usuario"
        title="Información temporal"
        description="Consulta la ubicación temporal del participante y los contenidos vigentes asociados a su momento actual dentro del cronograma."
      />

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando información del participante...
          </p>
          {['h-[200px]', 'h-[120px]'].map((heightClass) => (
            <div
              key={heightClass}
              className={`${heightClass} animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : loadError ? (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="Información no disponible"
          role="alert"
        >
          {loadError}
        </PanelNotice>
      ) : temporalInformation ? (
        <>
          <TemporalInformationSummary
            participantName={temporalInformation.participantName}
            temporalUnitName={temporalInformation.temporalUnitName}
            temporalUnitOrder={temporalInformation.temporalUnitOrder}
            calculationDateText={temporalInformation.calculationDateText}
            elapsedTimeText={temporalInformation.elapsedTimeText}
            completed={temporalInformation.completed}
            message={temporalInformation.message}
          />

          <section
            aria-labelledby="current-content-title"
            className="flex flex-col gap-[var(--space-4)]"
          >
            <div className="flex items-baseline justify-between gap-[var(--space-3)]">
              <h2
                id="current-content-title"
                className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
              >
                Contenidos vigentes
              </h2>

              <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
                {currentContent.length}{' '}
                {currentContent.length === 1 ? 'contenido' : 'contenidos'}
              </p>
            </div>

            {currentContent.length > 0 ? (
              <div className="grid gap-[var(--space-4)]">
                {currentContent.map((content) => (
                  <CurrentContentCard
                    key={content.associationId ?? content.id}
                    content={content}
                    onSelect={onSelectContent}
                  />
                ))}
              </div>
            ) : (
              <PanelNotice
                tone="neutral"
                icon={FileStack}
                title="No hay contenido vigente"
                role="status"
              >
                El participante no tiene contenido disponible para su
                ubicación temporal actual.
              </PanelNotice>
            )}
          </section>
        </>
      ) : (
        <PanelNotice
          tone="neutral"
          icon={CalendarOff}
          title="No hay información temporal disponible"
          role="status"
        >
          Cuando exista información temporal del participante, aparecerá en
          esta vista.
        </PanelNotice>
      )}
    </div>
  );
}
