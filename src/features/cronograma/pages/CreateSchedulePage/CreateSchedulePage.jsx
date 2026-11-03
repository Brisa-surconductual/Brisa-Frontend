import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { NextStepsCard } from '@/features/cronograma/components/NextStepsCard/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { ScheduleForm } from '@/features/cronograma/components/ScheduleForm/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { crearCronograma } from '../../api/cronograma/crearCronograma';
import { useCreateScheduleForm } from './hooks/useCreateScheduleForm.js';

// Orden real del flujo, tal como lo exige el panel del cronograma.
const NEXT_STEPS = Object.freeze([
  'Añade sus unidades temporales desde el panel del cronograma.',
  'Asocia los contenidos de cada unidad y define su disponibilidad.',
  'Valida y activa el cronograma. Sin unidades no se puede activar.',
]);

function toIsoMidnight(dateOnlyString) {
  return `${dateOnlyString}T00:00:00.000Z`;
}

function normalizeScheduleForm(form) {
  return {
    nombre: form.name,
    fecha_activacion: toIsoMidnight(form.activationDate),
    es_base: form.isBase,
  };
}

export function CreateSchedulePage() {
  const navigate = useNavigate();

  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleValidSubmit(formValues) {
    if (pending.current) return;
    pending.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await crearCronograma(normalizeScheduleForm(formValues));
      navigate('/app/administrativo/cronograma');
    } catch (error) {
      const message = error.response?.data?.message;
      setSubmitError(
        typeof message === 'string'
          ? message
          : 'No pudimos crear el cronograma. Intenta nuevamente.',
      );
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  const { form, errors, handleChange, handleSubmit } = useCreateScheduleForm({
    onValidSubmit: handleValidSubmit,
  });

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCancel() {
    navigate('/app/administrativo/cronograma');
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>Volver a cronogramas</BackButton>

      <SchedulePageHeader
        eyebrow="Administración · Cronogramas"
        title="Crear cronograma"
        description="Registra la información general del nuevo cronograma."
      />

      {submitError && (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo crear el cronograma"
          role="alert"
        >
          {submitError}
        </PanelNotice>
      )}

      <div className="grid items-start gap-[var(--space-6)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <ScheduleForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        <NextStepsCard
          id="crear-cronograma-pasos"
          title="Después de crearlo"
          steps={NEXT_STEPS}
        />
      </div>
    </div>
  );
}
