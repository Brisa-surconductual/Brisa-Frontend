import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { ParticipantProgressSummary } from '@/features/cronograma/components/ParticipantProgressSummary/index.js';

import { ParticipantProgressList } from '@/features/cronograma/components/ParticipantProgressList/index.js';

import { CompletedParticipantProgress } from '@/features/cronograma/components/CompletedParticipantProgress/index.js';

import { listarUbicacionesTemporalesParticipantes } from '@/features/cronograma/api/contenidoVigente/listarUbicacionesTemporalesParticipantes.jsx';

import { PARTICIPANT_PROGRESS_STATUS } from '@/features/cronograma/types/participantProgressTypes.js';

const EMPTY_PROGRESS_SUMMARY = null;
const EMPTY_PARTICIPANTS = Object.freeze([]);
const EMPTY_COMPLETED_PARTICIPANT = null;

function getParticipantStatus(participant) {
  if (participant.cronograma_finalizado === true) {
    return PARTICIPANT_PROGRESS_STATUS.COMPLETADO;
  }

  if (participant.en_pausa_administrativa === true) {
    return PARTICIPANT_PROGRESS_STATUS.EN_PAUSA;
  }

  if (participant.id_cronograma_usuario) {
    return PARTICIPANT_PROGRESS_STATUS.ACTIVO;
  }

  return null;
}

function mapParticipant(participant) {
  return {
    id: participant.id_usuario,
    participantName: participant.correo_electronico,
    temporalUnitName: participant.nombre_unidad,
    currentWeek: participant.orden_unidad,
    currentDay: null,
    status: getParticipantStatus(participant),
  };
}

function createProgressSummary(participants, total) {
  const allParticipantsLoaded =
    total === participants.length;

  return {
    totalParticipants: total,
    activeParticipants: allParticipantsLoaded
      ? participants.filter(
          (participant) =>
            participant.status ===
            PARTICIPANT_PROGRESS_STATUS.ACTIVO,
        ).length
      : null,
    pausedParticipants: allParticipantsLoaded
      ? participants.filter(
          (participant) =>
            participant.status ===
            PARTICIPANT_PROGRESS_STATUS.EN_PAUSA,
        ).length
      : null,
  };
}

export function ParticipantProgressPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [progressSummary, setProgressSummary] = useState(
    EMPTY_PROGRESS_SUMMARY,
  );

  const [participants, setParticipants] = useState(
    EMPTY_PARTICIPANTS,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const completedParticipant = EMPTY_COMPLETED_PARTICIPANT;

  useEffect(() => {
    let isMounted = true;

    async function loadParticipants() {
      try {
        const data =
          await listarUbicacionesTemporalesParticipantes();

        if (!isMounted) {
          return;
        }

        const mappedParticipants = Array.isArray(
          data?.participantes,
        )
          ? data.participantes.map(mapParticipant)
          : [];

        setParticipants(mappedParticipants);

        setProgressSummary(
          createProgressSummary(
            mappedParticipants,
            data?.total ?? mappedParticipants.length,
          ),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadError(
          'No pudimos consultar el progreso de los participantes.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadParticipants();

    return () => {
      isMounted = false;
    };
  }, []);

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
    navigate('/app/administrativo/cronograma');
  }

  function handleViewTemporalInformation(participant) {
    if (!participant?.id) {
      return;
    }

    navigate(
      `/app/administrativo/cronograma/progreso/${encodeURIComponent(participant.id)}/informacion-temporal`,
    );
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
            ← Volver al cronograma
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Cronograma
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Progreso por usuario
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta la ubicación y el progreso temporal de los participantes
              dentro del cronograma.
            </p>
          </header>
          <ParticipantProgressSummary summary={progressSummary} />

          {loading ? (
            <p
              className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando participantes...
            </p>
          ) : loadError ? (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
            </div>
          ) : participants.length > 0 ? (
            <ParticipantProgressList
              participants={participants}
              onViewTemporalInformation={handleViewTemporalInformation}
            />
          ) : (
            <section
              className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-8)] text-center"
              aria-label="Progreso de participantes"
            >
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
                No hay información de progreso para mostrar
              </h2>

              <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[560px] text-[12px] leading-[1.6] text-[var(--text-muted)]">
                Cuando exista información de progreso de los participantes,
                aparecerá en esta vista.
              </p>
            </section>
          )}
          {completedParticipant ? (
            <CompletedParticipantProgress
              participantName={completedParticipant.participantName}
              email={completedParticipant.email}
              completedWeeks={completedParticipant.completedWeeks}
              totalWeeks={completedParticipant.totalWeeks}
              completedDays={completedParticipant.completedDays}
              totalDays={completedParticipant.totalDays}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
