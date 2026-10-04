import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import { TemporalUnitList } from '@/features/cronograma/components/TemporalUnitList/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

export function SchedulePanelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idSchedule } = useParams();
  const { role, logout } = useAuth();

  const schedule = location.state?.schedule;

  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoading(true);
      try {
        // Ejemplo: const data = await obtenerUnidadesPorCronograma(idSchedule);
        // setUnits(data);
        
        // Por ahora lo dejamos vacío para que veas el EmptyState, 
        // o puedes meter datos falsos para probar tu TemporalUnitList
        setUnits([]); 
      } catch (error) {
        console.error("Error al cargar las unidades:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (schedule) fetchUnits();
  }, [idSchedule, schedule]);

  // Funciones de navegación
  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreateTemporalUnit() {
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/crear-unidad`, {
      state: { schedule } 
    });
  }

  function handleViewUnitDetails(unit) {
    // Aquí puedes navegar al detalle específico de una unidad
    navigate(`/app/administrativo/cronograma/unidad/${encodeURIComponent(unit.id)}`, {
      state: { unit }
    });
  }

  // Fallback de seguridad por si se recarga la página sin el state
  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--surface-bg)]">
        <p className="text-[var(--text-muted)] font-medium mb-4">No se encontró la información del cronograma.</p>
        <Button onClick={handleBack}>Volver a inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader roleLabel={role ?? 'ADMINISTRATIVO'} onLogout={logout} />

      <main className="pb-[var(--space-8)]">
        <div className="mx-auto w-full max-w-[1200px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          
          {/* Navegación tipo "Breadcrumb" */}
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)] transition-colors hover:text-[var(--brand-700)]"
            onClick={handleBack}
          >
            ← Volver a todos los cronogramas
          </button>

          {/* CABEZOTE FORMAL DEL CRONOGRAMA */}
          <header className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-white p-[var(--space-5)] md:p-[var(--space-6)] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[var(--space-4)]">
              
              <div className="flex-1">
                <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
                  Panel de Gestión
                </p>
                <h1 className="mt-[var(--space-1)] mb-0 text-[28px] font-extrabold text-[var(--text-primary)] md:text-[32px]">
                  {schedule.nombreCronograma}
                </h1>
                
                <div className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-4)] text-[13px]">
                  <div className="flex items-center gap-2 bg-[var(--surface-hover)] px-3 py-1.5 rounded-md border border-[var(--surface-border)]">
                    <span className="text-[var(--text-muted)] font-semibold">Estado:</span>
                    <span className={`font-bold ${schedule.estado === 'ACTIVO' ? 'text-[var(--success-text)]' : 'text-[var(--text-secondary)]'}`}>
                      {schedule.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--surface-hover)] px-3 py-1.5 rounded-md border border-[var(--surface-border)]">
                    <span className="text-[var(--text-muted)] font-semibold">Tipo:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {schedule.esBase ? 'Cronograma Base' : 'Cronograma Estándar'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--surface-hover)] px-3 py-1.5 rounded-md border border-[var(--surface-border)]">
                    <span className="text-[var(--text-muted)] font-semibold">Creación:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {schedule.fechaCreacion ? schedule.fechaCreacion.split('T')[0] : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones principales del cronograma */}
              <div className="mt-[var(--space-2)] md:mt-0 flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCreateTemporalUnit} className="shadow-sm">
                  + Crear unidad temporal
                </Button>
              </div>

            </div>
          </header>

          {/* SECCIÓN DE UNIDADES TEMPORALES */}
          <section className="mt-[var(--space-8)]">
            <div className="mb-[var(--space-5)] flex items-end justify-between">
              <div>
                <h2 className="m-0 text-[20px] font-extrabold text-[var(--text-primary)]">
                  Unidades Temporales
                </h2>
                <p className="mt-1 mb-0 text-[13px] text-[var(--text-muted)]">
                  Gestiona los bloques de tiempo asignados a este cronograma.
                </p>
              </div>
              <div className="text-[13px] font-bold text-[var(--brand-600)] bg-[var(--brand-50)] px-3 py-1 rounded-full">
                Total: {units.length}
              </div>
            </div>

            {isLoading ? (
              <p className="text-[14px] text-[var(--text-muted)]">Cargando unidades temporales...</p>
            ) : units.length > 0 ? (
              /* Usamos tu componente existente para renderizar las cartas de unidades */
              <TemporalUnitList units={units} onViewDetails={handleViewUnitDetails} />
            ) : (
              /* Usamos tu componente existente de estado vacío */
              <EmptyScheduleState />
            )}
          </section>

        </div>
      </main>
    </div>
  );
}