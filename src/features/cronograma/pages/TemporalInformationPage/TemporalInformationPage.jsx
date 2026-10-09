import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';
import { TemporalInformationSummary } from '@/features/cronograma/components/TemporalInformationSummary/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { obtenerContenidoVigenteUsuario } from '@/features/cronograma/api/contenidoVigente/obtenerContenidoVigenteUsuario.jsx';
import { obtenerUbicacionTemporalParticipante } from '@/features/cronograma/api/contenidoVigente/obtenerUbicacionTemporalParticipante.jsx';

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

function formatAvailability(start, end) {
  if (!start || !end) {
    return '';
  }

  return `${new Date(start).toLocaleString()} → ${new Date(end).toLocaleString()}`;
}

function mapCurrentContent(content) {
  return {
    id: content.id_contenido,
    associationId: content.id_contenido_cronograma,
    name: content.nombre_contenido,
    type: content.tipo_contenido,
    temporalUnitId: content.id_unidad_temporal,
    temporalUnitName: content.nombre_unidad,
    temporalUnitOrder: content.orden_unidad,
    order: content.orden_contenido,
    status: content.estado_disponibilidad,
    availabilityText: formatAvailability(
      content.fecha_inicio_disponibilidad,
      content.fecha_fin_disponibilidad,
    ),
  };
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
  const { logout } = useAuth();

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
            ? contents.map(mapCurrentContent)
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

    loadParticipantInformation();

    return () => {
      isMounted = false;
    };
  }, [participantId]);

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
  }

  function handleBack() {
    navigate('/app/administrativo/cronograma/progreso');
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel="Administrativo"
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al progreso
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Cronograma
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Información temporal
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta la ubicación temporal del participante y los contenidos
              vigentes asociados a su momento actual dentro del cronograma.
            </p>
          </header>

          {loading ? (
            <p
              className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando información del participante...
            </p>
          ) : loadError ? (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
            </div>
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

              <section aria-labelledby="current-content-title">
                <h2
                  id="current-content-title"
                  className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
                >
                  Contenidos vigentes
                </h2>

                {currentContent.length > 0 ? (
                  <div className="mt-[var(--space-3)] grid gap-[var(--space-4)]">
                    {currentContent.map((content) => (
                      <CurrentContentCard
                        key={content.associationId ?? content.id}
                        content={content}
                        onSelect={onSelectContent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-[var(--space-3)]">
                    <EmptyScheduleState
                      title="No hay contenido vigente"
                      description="El participante no tiene contenido disponible para su ubicación temporal actual."
                    />
                  </div>
                )}
              </section>
            </>
          ) : (
            <EmptyScheduleState
              title="No hay información temporal disponible"
              description="Cuando exista información temporal del participante, aparecerá en esta vista."
            />
          )}
        </div>
      </main>
    </div>
  );
}