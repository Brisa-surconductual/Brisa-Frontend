import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AlertTriangle, CircleCheck, Info } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { TemporalUnitForm } from '@/features/cronograma/components/TemporalUnitForm/index.js';
import { useCreateTemporalUnitForm } from './hooks/useCreateTemporalUnitForm.js';
import { crearUnidadTemporal } from '@/features/cronograma/api/unidadTemporal/crearUnidadTemporal.jsx';
import { listSchedule } from '../../api/cronograma/listSchedule.jsx';

const PAGE_CLASS =
  'mx-auto flex w-full max-w-[800px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]';

export function CreateTemporalUnitPage() {
  const navigate = useNavigate();
  const { idSchedule } = useParams();
  const location = useLocation(); // Rescatamos la memoria de React Router

  // Extraemos el schedule que viene del panel para no perderlo
  const schedule = location.state?.schedule;

  // Estado para controlar nuestra alerta visual de éxito
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useCreateTemporalUnitForm({
    onValidSubmit: handleValidSubmit,
  });

  async function handleValidSubmit(formValues) {
    const schedules = await listSchedule();
    const current = schedules.find((item) => item.idCronograma === idSchedule);
    if (!current)
      throw new Error('No se encontró el cronograma. Regresa al panel.');
    if (current.estado !== 'INACTIVO') {
      throw new Error(
        'El cronograma ya está activo y no admite nuevas unidades. Regresa al panel y configura un nuevo cronograma.',
      );
    }
    const fechaInicioLimpia = formValues.startDate.split('T')[0];
    const fechaFinLimpia = formValues.endDate.split('T')[0];

    const payload = {
      id_cronograma: idSchedule,
      nombre: formValues.name,
      fecha_inicio: fechaInicioLimpia,
      fecha_fin: fechaFinLimpia,
    };

    return crearUnidadTemporal(payload)
      .then(() => {
        // 1. Activamos la pantalla de éxito
        setIsSuccess(true);

        // 2. Esperamos 2 segundos y luego redirigimos devolviendo el "schedule" a la memoria
        setTimeout(() => {
          navigate(
            `/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/panel`,
            {
              state: { schedule }, // ¡ESTO ARREGLA LA REDIRECCIÓN!
            },
          );
        }, 2000);
      })
      .catch((error) => {
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Revisa los datos. El servidor rechazó la solicitud (Error 400).';
        throw new Error(backendMessage);
      });
  }

  function handleBack() {
    // Si cancela, también le devolvemos su schedule al panel
    navigate(
      `/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/panel`,
      {
        state: { schedule },
      },
    );
  }

  if (isSuccess) {
    return (
      <div className={PAGE_CLASS}>
        <div
          role="status"
          className="flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--success-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-10)] text-center shadow-[var(--shadow-sm)]"
        >
          <span
            className="mb-[var(--space-2)] flex h-[64px] w-[64px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--success-bg)] text-[var(--success-text)]"
            aria-hidden="true"
          >
            <CircleCheck size={32} strokeWidth={1.8} />
          </span>
          <h1 className="m-0 text-[length:var(--font-size-2xl)] font-extrabold text-[var(--text-primary)]">
            Unidad creada con éxito
          </h1>
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            Redirigiendo al panel del cronograma...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASS}>
      <BackButton onClick={handleBack}>
        Regresar al panel del cronograma
      </BackButton>

      <SchedulePageHeader
        eyebrow="Unidad temporal"
        title="Nueva unidad temporal"
        description="Define el nombre y el periodo de tiempo asignado para esta fase del cronograma."
      >
        {/* Solo si llegó desde el panel: sin state no se inventa el nombre. */}
        {schedule?.nombreCronograma && (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            Cronograma:{' '}
            <strong className="font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
              {schedule.nombreCronograma}
            </strong>
          </p>
        )}
      </SchedulePageHeader>

      <PanelNotice tone="info" icon={Info} role="note">
        Solo se pueden añadir unidades a un cronograma inactivo. Lo
        comprobamos al guardar.
      </PanelNotice>

      {submitError && (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo crear la unidad"
          role="alert"
        >
          {submitError}
        </PanelNotice>
      )}

      <TemporalUnitForm
        form={form}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleBack}
        submitLoading={isSubmitting}
      />
    </div>
  );
}
