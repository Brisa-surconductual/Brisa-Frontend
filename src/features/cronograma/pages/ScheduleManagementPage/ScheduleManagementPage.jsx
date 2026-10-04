import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';
import { ScheduleFilters } from '@/features/cronograma/components/ScheduleFilters/index.js';
import { TemporalUnitList } from '@/features/cronograma/components/TemporalUnitList/index.js';

import { ScheduleCard } from '../../components/ScheduleCard/ScheduleCard'; 
import { listSchedule } from '../../api/cronograma/listSchedule'; 

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ScheduleActivationDialog } from '@/features/cronograma/components/ScheduleActivationDialog/index.js';
import { ScheduleActivationStatus } from '@/features/cronograma/components/ScheduleActivationStatus/index.js';
import { SCHEDULE_ACTIVATION_STATUS } from '@/features/cronograma/types/scheduleTypes.js';

const EMPTY_UNITS = Object.freeze([]);

export function ScheduleManagementPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const activationValidations = [];
  const scheduleActivationStatus = SCHEDULE_ACTIVATION_STATUS.UNKNOWN;

  const units = EMPTY_UNITS; 
  const resultCount = units.length;
  const totalCount = units.length;

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await listSchedule();
        setSchedules(data);
      } catch (error) {
        console.error('Error al cargar cronogramas:', error);
      }
    };
    fetchSchedules();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) return;
    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }
    navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
  }

  function handleViewDetails(unit) {
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(unit.id)}`, {
      state: { unit },
    });
  }

  function handleCreateUnit() {
    if (selectedScheduleId) {
      navigate(`/app/administrativo/cronograma/${encodeURIComponent(selectedScheduleId)}/crear-unidad-temporal`);
    }
  }
  function handleViewSchedulePanel(schedule) {
    const identifier = schedule.idCronograma
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(identifier)}/panel`, {
      state: { schedule }
    });
  }

  function handleCreateSchedule() {
    navigate('/app/administrativo/cronograma/crear');
  }

  function handleActivateSchedule() {
    setIsActivationDialogOpen(true);
  }

  function handleCancelActivation() {
    setIsActivationDialogOpen(false);
  }

  function handleConfirmActivation() {
    setIsActivationDialogOpen(false);
  }

  function handleViewPauses() {
    navigate('/app/administrativo/cronograma/pausas');
  }

  function handleViewProgress() {
    navigate('/app/administrativo/cronograma/progreso');
  }

  function handleViewContents() {
    navigate('/app/administrativo/cronograma/contenidos');
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader roleLabel="Administrativo" onLogout={handleLogout} />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
            <div>
              <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
                Administración
              </p>

              <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
                Cronogramas y Unidades
              </h1>

              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Selecciona un cronograma para ver y gestionar sus unidades temporales.
              </p>
            </div>

            <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:flex-wrap">
              <Button variant="secondary" onClick={handleViewProgress}>
                Progreso por usuario
              </Button>
              <Button variant="secondary" onClick={handleViewPauses}>
                Pausas administrativas
              </Button>
              <Button variant="secondary" onClick={handleViewContents}>
                Gestionar contenidos
              </Button>
              <Button onClick={handleCreateSchedule}>
                Crear cronograma
              </Button>
              {/* Quitamos el botón viejo de crear unidad, ahora depende de la selección */}
            </div>
          </header>

          <ScheduleActivationStatus
            status={scheduleActivationStatus}
            onActivate={handleActivateSchedule}
          />

          <section className="flex flex-col gap-5 mt-4">
            <h2 className="text-[18px] font-extrabold text-[var(--text-primary)] m-0">
              Cronogramas
            </h2>
              
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule, index) => (
                <ScheduleCard
                  key={schedule.id_cronograma || index} // Fallback de key
                  schedule={schedule}
                  onClick={() => handleViewSchedulePanel(schedule)}
                />
              ))}
            </div>

            {selectedScheduleId && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--brand-50)] rounded-xl border border-[var(--brand-200)] shadow-sm animate-fade-in">
                <div>
                  <h4 className="m-0 text-[15px] font-bold text-[var(--brand-800)]">
                    Cronograma Seleccionado
                  </h4>
                  <p className="m-0 mt-1 text-[13px] text-[var(--brand-600)]">
                    Ya puedes registrar unidades temporales para este cronograma.
                  </p>
                </div>
                <Button onClick={handleCreateUnit} className="whitespace-nowrap shadow-sm">
                  + Crear unidad temporal
                </Button>
              </div>
            )}
          </section>

          <hr className="my-4 border-[var(--border-color)]" />

          <ScheduleFilters
            status={status}
            date={date}
            resultCount={resultCount}
            totalCount={totalCount}
            onStatusChange={setStatus}
            onDateChange={setDate}
          />

          {units.length > 0 ? (
            <TemporalUnitList units={units} onViewDetails={handleViewDetails} />
          ) : (
            <EmptyScheduleState />
          )}
        </div>
      </main>

      <ScheduleActivationDialog
        open={isActivationDialogOpen}
        validations={activationValidations}
        onConfirm={handleConfirmActivation}
        onCancel={handleCancelActivation}
      />
    </div>
  );
}