import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarOff, CircleCheck, Plus } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { AdministrativePauseList } from '@/features/cronograma/components/AdministrativePauseList/index.js';
import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { getAdministrativeBreak } from '@/features/cronograma/api/pausasAdministrativas/getAdministrativeBreak';
import { annularAdministrativeBreak } from '@/features/cronograma/api/pausasAdministrativas/annularAdministrativeBreal';

export function AdministrativePauseHistoryPage() {
  
  const navigate = useNavigate();
  const [selectedPause, setSelectedPause] = useState(null);
  const [pauses, setPauses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Un fallo de carga no debe parecer un historial vacío.
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchPauses = async () => {
      setIsLoading(true);
      try {
        const response = await getAdministrativeBreak();
        const dataArray = Array.isArray(response) ? response : (response?.data || []);
        setPauses(dataArray);
      } catch (error) {
        // Solo el estado HTTP: el error de axios incluye la
        // cabecera CSRF de la sesión.
        console.error(
          'Error cargando pausas administrativas. Estado HTTP:',
          error?.response?.status ?? 'sin respuesta',
        );
        setLoadError(
          'No pudimos cargar las pausas administrativas. Intenta nuevamente.',
        );
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
      // Solo el estado HTTP: el error de axios incluye la URL
      // con el identificador del estudiante y la cabecera CSRF.
      console.error(
        'Error al anular la pausa. Estado HTTP:',
        error?.response?.status ?? 'sin respuesta',
      );

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

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreatePause() {
    navigate('/app/administrativo/cronograma/pausas/nueva');
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>Volver a cronogramas</BackButton>

      <SchedulePageHeader
        eyebrow="Administración · Cronogramas"
        title="Pausas administrativas"
        description="Consulta el historial de pausas administrativas registradas."
        actions={
          <Button onClick={handleCreatePause} className="w-full sm:w-auto">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Registrar pausa
          </Button>
        }
      />

      {successMessage && (
        <PanelNotice tone="success" icon={CircleCheck} role="status">
          {successMessage}
        </PanelNotice>
      )}

      {actionError && (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo anular la pausa"
          role="alert"
        >
          {actionError}
        </PanelNotice>
      )}

      <section
        aria-labelledby="historial-pausas-titulo"
        aria-busy={isLoading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div className="flex items-baseline justify-between gap-[var(--space-3)]">
          <h2
            id="historial-pausas-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Historial
          </h2>

          {!isLoading && !loadError && (
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
              {pauses.length} {pauses.length === 1 ? 'pausa' : 'pausas'}
            </p>
          )}
        </div>

        {isLoading ? (
          <>
            <p role="status" className="sr-only">
              Cargando pausas administrativas...
            </p>
            <div className="grid gap-[var(--space-4)] lg:grid-cols-2" aria-hidden="true">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="h-[240px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                />
              ))}
            </div>
          </>
        ) : loadError ? (
          <PanelNotice
            tone="danger"
            icon={AlertTriangle}
            title="Historial no disponible"
            role="alert"
          >
            {loadError}
          </PanelNotice>
        ) : pauses.length > 0 ? (
          <AdministrativePauseList
            pauses={pauses}
            disabled={isSubmitting}
            onAnnul={handleAnnulPause}
          />
        ) : (
          <PanelNotice
            tone="neutral"
            icon={CalendarOff}
            title="No hay pausas para mostrar"
            role="status"
          >
            Cuando existan pausas administrativas registradas, aparecerán en
            este historial.
          </PanelNotice>
        )}
      </section>

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
