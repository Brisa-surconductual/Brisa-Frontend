import { useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, SearchX } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { NextStepsCard } from '@/features/cronograma/components/NextStepsCard/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { PsychoeducationalContentForm } from '@/features/cronograma/components/PsychoeducationalContentForm/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';

import { usePsychoeducationalContentForm } from './hooks/usePsychoeducationalContentForm.js';

import { crearContenido } from '@/features/cronograma/api/contenido/crearContenido.jsx';
import { actualizarContenido } from '@/features/cronograma/api/contenido/actualizarContenido.jsx';
import { contentFormReturnPath } from '../../utils/contentFormReturnPath.js';

// Flujo real de creación: el contenido queda listo al tener recursos.
const CREATION_STEPS = Object.freeze([
  'Registra el nombre y el tipo del contenido.',
  'Guarda al menos un recurso y asigna su módulo destino.',
]);

const EMPTY_CONTENT = Object.freeze({
  name: '',
  type: '',
});

export function ContentFormPage({ initialValues, mode = 'create' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId } = useParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isEditMode = mode === 'edit';
  const returnPath = contentFormReturnPath(
    location.state?.returnToAssociation,
    isEditMode,
  );

  const navigationContent = location.state?.content ?? null;

  const selectedContent = initialValues ?? navigationContent;

  const resolvedInitialValues = selectedContent ?? EMPTY_CONTENT;

  const hasEditContent = !isEditMode || Boolean(selectedContent);

  async function handleValidSubmit(payload) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditMode) {
        const id = selectedContent?.id ?? contentId;

        await actualizarContenido({
          id,
          ...payload,
        });
      } else {
        const created = await crearContenido(payload);
        if (!created.id_contenido)
          throw new Error('No se recibió el identificador del contenido.');
        navigate(
          `/app/administrativo/cronograma/contenidos/${encodeURIComponent(created.id_contenido)}/recursos`,
          {
            state: {
              creationFlow: true,
              returnToAssociation: location.state?.returnToAssociation,
            },
          },
        );
        return;
      }

      navigate(returnPath);
    } catch {
      setSubmitError(
        isEditMode
          ? 'No pudimos actualizar el contenido. Verifica la información e intenta nuevamente.'
          : 'No pudimos crear el contenido. Verifica la información e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const { form, errors, handleChange, handleSubmit } =
    usePsychoeducationalContentForm({
      initialValues: resolvedInitialValues,
      onValidSubmit: handleValidSubmit,
    });

  function handleBack() {
    navigate(returnPath);
  }

  const fromAssociation = Boolean(
    location.state?.returnToAssociation && !isEditMode,
  );

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>
        {fromAssociation
          ? 'Volver a la unidad temporal'
          : 'Volver a contenidos'}
      </BackButton>

      <SchedulePageHeader
        eyebrow="Contenidos psicoeducativos"
        title={
          isEditMode
            ? 'Editar contenido psicoeducativo'
            : 'Crear contenido psicoeducativo'
        }
        description={
          isEditMode
            ? 'Actualiza la información general del contenido seleccionado.'
            : 'Paso 1 de 2: registra los datos. Después debes guardar al menos un recurso con su módulo destino para completar el contenido.'
        }
      />

      {submitError && (
        <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
          {submitError}
        </PanelNotice>
      )}

      {hasEditContent ? (
        <div
          className={
            isEditMode
              ? 'max-w-[720px]'
              : 'grid items-start gap-[var(--space-6)] lg:grid-cols-[minmax(0,1fr)_320px]'
          }
        >
          <PsychoeducationalContentForm
            form={form}
            errors={errors}
            loading={isSubmitting}
            submitLabel={
              isEditMode ? 'Guardar cambios' : 'Continuar con recursos'
            }
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleBack}
          />

          {!isEditMode && (
            <NextStepsCard
              id="crear-contenido-pasos"
              title={
                fromAssociation
                  ? 'Después volverás a la unidad'
                  : 'Cómo se completa'
              }
              steps={CREATION_STEPS}
            />
          )}
        </div>
      ) : (
        <PanelNotice
          tone="neutral"
          icon={SearchX}
          title="Contenido no disponible"
          role="status"
          action={
            <Button variant="secondary" onClick={handleBack}>
              Volver a contenidos
            </Button>
          }
        >
          No se recibió la información del contenido seleccionado.
          {contentId ? ` Identificador: ${contentId}.` : ''}
        </PanelNotice>
      )}
    </div>
  );
}
