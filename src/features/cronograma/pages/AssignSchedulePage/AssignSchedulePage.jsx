import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarX2,
  CircleCheck,
  Clock3,
  SkipForward,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';

import { BackButton } from '../../components/BackButton/index.js';
import { FormSection } from '../../components/FormSection/index.js';
import { PanelNotice } from '../../components/PanelNotice/index.js';
import { ScheduleOptionList } from '../../components/ScheduleOptionList/index.js';
import { SchedulePageHeader } from '../../components/SchedulePageHeader/index.js';
import { SearchableUserSelect } from '../../components/SearchableUserSelect/SearchableUserSelect.jsx';

import { assignScheduleToUser } from '../../api/cronograma/assingSchuldeToUser.jsx';
import { listSchedule } from '../../api/cronograma/listSchedule.jsx';

function getApiErrorMessage(error, fallbackMessage) {
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg; 
  }
  if (error?.message) {
    return error.message;
  }
  return fallbackMessage;
}

export function AssignSchedulePage() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Estados del formulario
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [interrumpir, setInterrumpir] = useState(true); // Por defecto en true
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const data = await listSchedule();
        setSchedules(data || []);
      } catch (error) {
        setLoadError('No se pudieron cargar los cronogramas disponibles.');
      } finally {
        setLoading(false);
      }
    }
    void fetchSchedules();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!selectedUserId) {
      setSubmitError('Debes seleccionar un participante.');
      return;
    }
    if (!selectedScheduleId) {
      setSubmitError('Debes seleccionar un cronograma de la lista.');
      return;
    }

    setIsSubmitting(true);

    try {
      await assignScheduleToUser({
        userId: selectedUserId,
        scheduleId: selectedScheduleId,
        interrumpir,
      });

      setSuccessMessage('El cronograma ha sido asignado correctamente al usuario.');
      
      // Limpiamos después de 2 segundos y volvemos
      setTimeout(() => {
        navigate('/app/administrativo/cronograma');
      }, 2000);

    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Ocurrió un error al asignar el cronograma.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isComplete = Boolean(selectedUserId && selectedScheduleId);
  // Tras asignar, el envío queda bloqueado mientras se redirige.
  const isSubmitDisabled =
    isSubmitting || !selectedUserId || !selectedScheduleId || Boolean(successMessage);

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={() => navigate('/app/administrativo/cronograma')}>
        Volver a cronogramas
      </BackButton>

      <SchedulePageHeader
        eyebrow="Administración · Cronogramas"
        title="Asignar cronograma a usuario"
        description="Selecciona el participante y el nuevo cronograma que cursará."
      />

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        className="flex flex-col gap-[var(--space-5)]"
      >
        <FormSection
          id="asignar-participante"
          step={1}
          title="Seleccionar participante"
          description="Busca al participante por su correo electrónico."
        >
          <SearchableUserSelect
            value={selectedUserId}
            onChange={setSelectedUserId}
          />
        </FormSection>

        <FormSection
          id="asignar-cronograma"
          step={2}
          title="Seleccionar cronograma"
          description="Elige el cronograma que cursará el participante."
        >
          {loading ? (
            <div aria-busy="true" className="grid gap-[var(--space-3)] sm:grid-cols-2">
              <p role="status" className="sr-only">
                Cargando cronogramas...
              </p>
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="h-[88px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-hover)] motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : loadError ? (
            <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
              {loadError}
            </PanelNotice>
          ) : schedules.length === 0 ? (
            <PanelNotice tone="neutral" icon={CalendarX2} role="status">
              No hay cronogramas creados.
            </PanelNotice>
          ) : (
            <ScheduleOptionList
              schedules={schedules}
              selectedId={selectedScheduleId}
              onSelect={setSelectedScheduleId}
            />
          )}
        </FormSection>

        <FormSection
          id="asignar-opciones"
          step={3}
          title="Opciones de asignación"
          description="Define qué ocurre con el cronograma que cursa actualmente."
        >
          <div className="flex flex-col gap-[var(--space-3)]">
            <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-2)]">
              <Checkbox
                id="assign-interrupt"
                checked={interrumpir}
                onChange={(e) => setInterrumpir(e.target.checked)}
                aria-describedby="assign-interrupt-hint"
              >
                <span className="font-bold">Interrumpir cronograma actual</span>
              </Checkbox>

              <p
                id="assign-interrupt-hint"
                className="mt-0 mb-[var(--space-2)] pr-[var(--space-3)] pl-[45px] text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
              >
                Si está marcado, el usuario abandonará su cronograma actual
                inmediatamente y comenzará el nuevo. Si está desmarcado, el
                nuevo cronograma iniciará automáticamente cuando termine la
                última unidad del actual.
              </p>
            </div>

            <PanelNotice
              tone={interrumpir ? 'warning' : 'info'}
              icon={interrumpir ? SkipForward : Clock3}
              title={
                interrumpir
                  ? 'Se interrumpirá el cronograma actual'
                  : 'El nuevo cronograma esperará al actual'
              }
              role="status"
            >
              {interrumpir
                ? 'El participante abandonará su cronograma actual inmediatamente y comenzará el nuevo.'
                : 'El nuevo cronograma iniciará automáticamente cuando termine la última unidad del actual.'}
            </PanelNotice>
          </div>
        </FormSection>

        {successMessage && (
          <PanelNotice tone="success" icon={CircleCheck} role="status">
            {successMessage} Regresando a cronogramas...
          </PanelNotice>
        )}

        {submitError && (
          <PanelNotice
            tone="danger"
            icon={AlertTriangle}
            title="No se pudo asignar el cronograma"
            role="alert"
          >
            {submitError}
          </PanelNotice>
        )}

        <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
          <p
            id="asignar-resumen"
            className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
          >
            {isComplete
              ? 'Participante y cronograma seleccionados.'
              : 'Selecciona un participante y un cronograma para continuar.'}
          </p>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            aria-describedby="asignar-resumen"
            className="shrink-0"
          >
            {isSubmitting ? 'Asignando...' : 'Asignar cronograma'}
          </Button>
        </div>
      </form>
    </div>
  );
}
