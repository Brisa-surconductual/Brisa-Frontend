import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { AdministrativePauseList } from '@/features/cronograma/components/AdministrativePauseList/index.js';

import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

const EMPTY_PAUSES = Object.freeze([]);
export function AdministrativePauseHistoryPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [selectedPause, setSelectedPause] = useState(null);

  const pauses = EMPTY_PAUSES;

  function handleAnnulPause(pause) {
    setSelectedPause(pause);
  }

  function handleCancelAnnul() {
    setSelectedPause(null);
  }

  function handleConfirmAnnul() {
    setSelectedPause(null);
  }

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

  function handleCreatePause() {
    navigate('/app/administrativo/cronograma/pausas/nueva');
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

          <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
            <div>
              <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
                Cronograma
              </p>

              <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
                Pausas administrativas
              </h1>

              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Consulta el historial de pausas administrativas registradas para
                los participantes.
              </p>
            </div>

            <Button className="shrink-0" onClick={handleCreatePause}>
              Registrar pausa
            </Button>
          </header>

          {pauses.length > 0 ? (
            <AdministrativePauseList
              pauses={pauses}
              onAnnul={handleAnnulPause}
            />
          ) : (
            <section
              className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-8)] text-center"
              aria-label="Historial de pausas administrativas"
            >
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
                No hay pausas para mostrar
              </h2>

              <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[520px] text-[12px] leading-[1.6] text-[var(--text-muted)]">
                Cuando existan pausas administrativas registradas, aparecerán en
                este historial.
              </p>
            </section>
          )}
        </div>
      </main>
      <ConfirmationDialog
        open={Boolean(selectedPause)}
        title="Anular pausa administrativa"
        description={
          selectedPause
            ? `¿Deseas anular la pausa administrativa de ${selectedPause.participantName}?`
            : ''
        }
        confirmText="Anular pausa"
        cancelText="Cancelar"
        onConfirm={handleConfirmAnnul}
        onCancel={handleCancelAnnul}
      />
    </div>
  );
}
