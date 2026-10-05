import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB, ADMINISTRATIVE_TABS } from '@/shared/data/administrativeTabs.js';
import { AdministrativePauseList } from '@/features/cronograma/components/AdministrativePauseList/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { getAdministrativeBreak } from '@/features/cronograma/api/pausasAdministrativas/getAdministrativeBreak';
import { annularAdministrativeBreak } from '@/features/cronograma/api/pausasAdministrativas/annularAdministrativeBreal';

export function AdministrativePauseHistoryPage() {
  
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedPause, setSelectedPause] = useState(null);
  const [pauses, setPauses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPauses = async () => {
      setIsLoading(true);
      try {
        const response = await getAdministrativeBreak();
        const dataArray = Array.isArray(response) ? response : (response?.data || []);
        setPauses(dataArray);
      } catch (error) {
        console.error("Error cargando pausas administrativas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPauses();
  }, []);

  function handleAnnulPause(pause) {
    setSelectedPause(pause);
  }

  function handleCancelAnnul() {
    setSelectedPause(null);
  }

  async function handleConfirmAnnul() {
    if (!selectedPause) return;

    setIsSubmitting(true);
    setActionError('');
    setSuccessMessage('');

    const { idUsuario, idPausaAdministrativa } = selectedPause;

    try {
      console.log('Anulando pausa:', { idUsuario, idPausaAdministrativa });

      await annularAdministrativeBreak(idUsuario, idPausaAdministrativa);

      setPauses((prevPauses) =>
        prevPauses.map((p) =>
          p.idPausaAdministrativa === idPausaAdministrativa
            ? { ...p, estado: 'ANULADA' }
            : p
        )
      );

      setSuccessMessage('Pausa administrativa anulada correctamente.');
      setSelectedPause(null);

    } catch (error) {
      console.error('Error al anular la pausa:', error);

      const data = error.response?.data;
      let mensajeDelBack = 'No fue posible anular la pausa administrativa.';

      if (data?.message) {
        mensajeDelBack = Array.isArray(data.message) ? data.message[0] : data.message;
      } else if (error.message) {
        mensajeDelBack = error.message;
      }

      setActionError(mensajeDelBack);
      setSelectedPause(null);
    } finally {
      setIsSubmitting(false);
    }
  }

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

  function handleCreatePause() {
    navigate('/app/administrativo/cronograma/pausas/nueva');
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
                Consulta el historial de pausas administrativas registradas.
              </p>
            </div>
            <Button className="shrink-0" onClick={handleCreatePause}>
              Registrar pausa
            </Button>
          </header>

          {isLoading ? (
            <p className="text-[14px] text-[var(--text-muted)] mt-4">Cargando pausas administrativas...</p>
          ) : pauses.length > 0 ? (
            <AdministrativePauseList pauses={pauses} onAnnul={handleAnnulPause} />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-8)] text-center">
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
                No hay pausas para mostrar
              </h2>
              <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[520px] text-[12px] leading-[1.6] text-[var(--text-muted)]">
                Cuando existan pausas administrativas registradas, aparecerán en este historial.
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
            ? `¿Deseas anular esta pausa administrativa registrada para el usuario seleccionado?`
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