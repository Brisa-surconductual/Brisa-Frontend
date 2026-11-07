import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdministrativePauseForm } from '@/features/cronograma/components/AdministrativePauseForm/index.js';
import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { useCreateAdministrativePauseForm } from './hooks/useCreateAdministrativePauseForm.js';
import { registerAdministrativeBreak } from '../../api/pausasAdministrativas/registerAdministartiveBreak.jsx';

const EMPTY_PARTICIPANT_OPTIONS = Object.freeze([]);

export function CreateAdministrativePausePage() {
  const navigate = useNavigate();

  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { form, errors, handleChange, handleSubmit: handleFormSubmit } =
    useCreateAdministrativePauseForm({
      onValidSubmit: async (formValues) => {
        setFormError('');
        setSuccessMessage('');

        const idUsuario = formValues.participantId;

        const payload = {
          fecha_inicio_pausa: formValues.startDate, 
          fecha_fin_pausa: formValues.endDate,     
          motivo_pausa: formValues.reason,         
        };

        try {
          await registerAdministrativeBreak(idUsuario, payload);

          setSuccessMessage('¡Pausa administrativa registrada correctamente!');

          setTimeout(() => {
            navigate('/app/administrativo/cronograma/pausas');
          }, 1500);

        } catch (error) {
          // Solo el estado HTTP: el error de axios incluye el
          // payload (motivo de la pausa) y la cabecera CSRF.
          console.error(
            'Error al registrar pausa. Estado HTTP:',
            error?.response?.status ?? 'sin respuesta',
          );
          
          const data = error.response?.data;
          let mensajeDelBack = 'No fue posible registrar la pausa administrativa.';
          
          if (data?.message) {
            mensajeDelBack = Array.isArray(data.message) ? data.message[0] : data.message;
          } else if (error.message) {
            mensajeDelBack = error.message;
          }

          setFormError(mensajeDelBack);
        }
      }
    });

  function handleBack() {
    navigate('/app/administrativo/cronograma/pausas'); // Regresa al listado de pausas
  }

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>
        Volver al historial de pausas
      </BackButton>

      <SchedulePageHeader
        eyebrow="Pausas administrativas"
        title="Registrar pausa administrativa"
        description="Registra un periodo de pausa para un participante del cronograma."
      />

      <AdministrativePauseForm
        form={form}
        errors={errors}
        formError={formError}
        successMessage={successMessage}
        // Tras registrar, el envío queda bloqueado mientras se redirige.
        submitDisabled={Boolean(successMessage)}
        participantOptions={EMPTY_PARTICIPANT_OPTIONS}
        onChange={handleChange}
        onSubmit={handleFormSubmit}
        onCancel={handleBack}
      />
    </div>
  );
}
