import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';
import { TemporalInformationSummary } from '@/features/cronograma/components/TemporalInformationSummary/index.js';
import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB, ADMINISTRATIVE_TABS } from '@/shared/data/administrativeTabs.js';
import { getTemporalInformationByUser } from '../../api/InfoTemporal/getTemporalLocationByUser';

export function TemporalInformationPage({ onSelectContent }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const params = useParams();
  const idUsuario = params.participantId || params.id_usuario || params.id || params.idUsuario;
  const [temporalInformation, setTemporalInformation] = useState(null);
  const [currentContent, setCurrentContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInformation = async () => {
      if (!idUsuario) {
        setError('No se proporcionó un ID de usuario válido en la URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getTemporalInformationByUser(idUsuario);
        const { ubicacion_temporal, contenidos_vigentes } = response;

        // Mapeamos los datos del backend a las props que espera tu componente Summary
        setTemporalInformation({
          // Si el back no devuelve el nombre aquí, usamos un genérico o el ID temporalmente
          participantName: 'Participante', 
          temporalUnitName: ubicacion_temporal.nombre_unidad || 'Unidad no asignada',
          temporalUnitOrder: ubicacion_temporal.orden_unidad || '-',
          calculationDateText: ubicacion_temporal.fecha_calculo 
            ? new Date(ubicacion_temporal.fecha_calculo).toLocaleString() 
            : 'N/A',
          elapsedTimeText: `${ubicacion_temporal.tiempo_efectivo_transcurrido_segundos || 0} segundos`,
          completed: ubicacion_temporal.cronograma_finalizado || false,
          message: ubicacion_temporal.mensaje || 'Información calculada correctamente.',
        });

        setCurrentContent(contenidos_vigentes || []);

      } catch (err) {
        console.error('Error cargando la información temporal:', err);
        setError('No fue posible cargar la información temporal del servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInformation();
  }, [idUsuario]);

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

          {/* Manejo de estado de Error */}
          {error && (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger-bg)] p-4">
              <p className="m-0 text-[13px] font-semibold text-[var(--danger-text)]">
                {error}
              </p>
            </div>
          )}

          {/* Manejo de estado de Carga */}
          {isLoading ? (
            <p className="text-[14px] text-[var(--text-muted)] mt-4">Calculando información temporal...</p>
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
                    {currentContent.map((content, index) => (
                      <CurrentContentCard
                        key={content.id_contenido || index}
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
          ) : !error ? (
            <EmptyScheduleState
              title="No hay información temporal disponible"
              description="Cuando exista información temporal del participante, aparecerá en esta vista."
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}