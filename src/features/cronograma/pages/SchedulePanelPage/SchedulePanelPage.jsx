import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import { TemporalUnitList } from '@/features/cronograma/components/TemporalUnitList/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

// Asegúrate de que esta ruta esté bien en tu proyecto local
import { getUnitTemporalByShulde } from '../../api/unidadTemporal/getUnitTemporalByShulde';

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
        const response = await getUnitTemporalByShulde(idSchedule);

        
        const dataArray = Array.isArray(response) ? response : (response?.data || []);
        const formattedUnits = dataArray.map(unit => {
          const now = new Date();
          const start = new Date(unit.fechaInicio);
          const end = new Date(unit.fechaFin);
          
          let currentStatus = 'POR_DEFINIR';
          if (now >= start && now <= end) currentStatus = 'ACTIVA';
          else if (now > end) currentStatus = 'COMPLETADA';
          else if (now < start) currentStatus = 'BLOQUEADA';

          return {
            ...unit, 
            status: currentStatus, 
          };
        });

        formattedUnits.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        setUnits(formattedUnits);

      } catch (error) {
        console.error("Error al cargar las unidades temporales:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (schedule) fetchUnits();
  }, [idSchedule, schedule]);

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreateTemporalUnit() {
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/crear-unidad`, {
      state: { schedule } 
    });
  }

  function handleViewUnitDetails(unit) {
    const unitId = unit.idUnidadTemporal || unit.id;
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(unitId)}`, {
      state: { unit }
    });
  }

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
          
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)] transition-colors hover:text-[var(--brand-700)]"
            onClick={handleBack}
          >
            ← Volver a todos los cronogramas
          </button>

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

              <div className="mt-[var(--space-2)] md:mt-0 flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCreateTemporalUnit} className="shadow-sm">
                  + Crear unidad temporal
                </Button>
              </div>

            </div>
          </header>

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
              <TemporalUnitList units={units} onViewDetails={handleViewUnitDetails} />
            ) : (
              <EmptyScheduleState />
            )}
          </section>

        </div>
      </main>
    </div>
  );
}