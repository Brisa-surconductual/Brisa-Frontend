import { useState, useEffect } from 'react';
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

import { getTemporalLocations } from '../../api/InfoTemporal/getTemporalLocations'; 

export function ParticipantProgressPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estados dinámicos para los datos de la API
  const [participants, setParticipants] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Este estado puede usarse si decides seleccionar a un usuario completado en particular
  const [completedParticipant, setCompletedParticipant] = useState(null); 

 useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getTemporalLocations({ page: 1, pageSize: 50 });
        const participantesCrudos = response?.participantes || [];

        // 1. Mapeamos usando los NOMBRES EXACTOS que esperan las props de la Card
        const participantesMapeados = participantesCrudos.map((p) => {
          
          // Determinamos el estado para que coincida con tus constantes (ACTIVO, EN_PAUSA, COMPLETADO)
          let estadoUI = p.estado_cronograma || 'INACTIVO';
          if (p.en_pausa_administrativa) estadoUI = 'EN_PAUSA';
          if (p.cronograma_finalizado) estadoUI = 'COMPLETADO';

          return {
            id: p.id_usuario,
            // La tarjeta pide participantName, le mandamos el correo (o nombre si viniera)
            participantName: p.correo_electronico, 
            
            // La tarjeta pide temporalUnitName
            temporalUnitName: p.nombre_unidad || p.mensaje || 'Sin unidad', 
            
            // El backend por ahora nos da el orden de la unidad, lo mapeamos aquí
            currentWeek: p.orden_unidad ? `Semana/Unidad ${p.orden_unidad}` : null, 
            currentDay: null, // Si luego tu back calcula el día exacto, lo pones acá
            
            // Estado visual
            status: estadoUI,
            
            raw: p 
          };
        });

        setParticipants(participantesMapeados);

        // 2. Mapeamos usando los NOMBRES EXACTOS que espera el Summary (totalParticipants, etc.)
        setProgressSummary({
          totalParticipants: response.total || 0,
          activeParticipants: participantesCrudos.filter(p => p.estado_cronograma === 'ACTIVO' && !p.en_pausa_administrativa).length,
          pausedParticipants: participantesCrudos.filter(p => p.en_pausa_administrativa).length,
        });

      } catch (err) {
        console.error("Error cargando el progreso de los participantes:", err);
        setError('No se pudo cargar la información de progreso. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
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
      console.warn("El participante no tiene un ID válido");
      return;
    }
    // Navegamos usando el ID mapeado del usuario
    navigate(
      `/app/administrativo/cronograma/progreso/${encodeURIComponent(participant.id)}/informacion-temporal`
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

          {/* Manejo de errores de carga */}
          {error && (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger-bg)] p-4">
              <p className="m-0 text-[13px] font-semibold text-[var(--danger-text)]">
                {error}
              </p>
            </div>
          )}

          {/* Renderizamos el resumen solo si ya hay data */}
          {progressSummary && (
            <ParticipantProgressSummary summary={progressSummary} />
          )}

          {/* Manejo de estados de Carga, Vacío o Lista llena */}
          {isLoading ? (
            <p className="text-[14px] text-[var(--text-muted)] mt-4">Cargando progreso de participantes...</p>
          ) : participants.length > 0 ? (
            <ParticipantProgressList
              participants={participants}
              onViewTemporalInformation={handleViewTemporalInformation}
            />
          ) : !error ? (
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
          ) : null}

          {completedParticipant && (
            <CompletedParticipantProgress
              participantName={completedParticipant.participantName}
              email={completedParticipant.email}
              completedWeeks={completedParticipant.completedWeeks}
              totalWeeks={completedParticipant.totalWeeks}
              completedDays={completedParticipant.completedDays}
              totalDays={completedParticipant.totalDays}
            />
          )}
        </div>
      </main>
    </div>
  );
}