import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';
import { ScheduleFilters } from '@/features/cronograma/components/ScheduleFilters/index.js';
import { TemporalUnitList } from '@/features/cronograma/components/TemporalUnitList/index.js';

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

  const activationValidations = [];
  const scheduleActivationStatus = SCHEDULE_ACTIVATION_STATUS.UNKNOWN;

  const units = EMPTY_UNITS;
  const resultCount = units.length;
  const totalCount = units.length;

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
  }

  function handleViewDetails(unit) {
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(unit.id)}`, {
      state: {
        unit,
      },
    });
  }

  function handleCreateUnit() {
    navigate('/app/administrativo/cronograma/nueva');
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
          <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
            <div>
              <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
                Administración
              </p>

              <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
                Cronograma
              </h1>

              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Consulta las unidades temporales del cronograma y sus estados.
              </p>
            </div>

            <div className="flex flex-col gap-[var(--space-3)] sm:flex-row">
              <Button variant="secondary" onClick={handleViewProgress}>
                Progreso por usuario
              </Button>

              <Button variant="secondary" onClick={handleViewPauses}>
                Pausas administrativas
              </Button>

              <Button onClick={handleCreateUnit}>Crear unidad temporal</Button>
            </div>
          </header>

          <ScheduleActivationStatus
            status={scheduleActivationStatus}
            onActivate={handleActivateSchedule}
          />

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
