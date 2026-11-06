import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';

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

    void loadParticipants();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>Volver a cronogramas</BackButton>

      <SchedulePageHeader
        eyebrow="Administración · Cronogramas"
        title="Progreso por usuario"
        description="Consulta la ubicación y el progreso temporal de los participantes dentro del cronograma."
      />

      <ParticipantProgressSummary summary={progressSummary} />

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-3)]">
          <p role="status" className="sr-only">
            Cargando participantes...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-[96px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : loadError ? (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="Progreso no disponible"
          role="alert"
        >
          {loadError}
        </PanelNotice>
      ) : participants.length > 0 ? (
        <ParticipantProgressList
          participants={participants}
          onViewTemporalInformation={handleViewTemporalInformation}
        />
      ) : (
        <PanelNotice
          tone="neutral"
          icon={Users}
          title="No hay información de progreso para mostrar"
          role="status"
        >
          Cuando exista información de progreso de los participantes,
          aparecerá en esta vista.
        </PanelNotice>
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
  );
}
