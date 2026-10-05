import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB,ADMINISTRATIVE_TABS } from '@/shared/data/administrativeTabs.js';
import { AdministrativePauseForm } from '@/features/cronograma/components/AdministrativePauseForm/index.js';
import { useCreateAdministrativePauseForm } from './hooks/useCreateAdministrativePauseForm.js';
import { registerAdministrativeBreak } from '../../api/pausasAdministrativas/registerAdministartiveBreak.jsx';

const EMPTY_PARTICIPANT_OPTIONS = Object.freeze([]);

export function CreateAdministrativePausePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
          console.log('Registrando pausa para usuario:', idUsuario, payload);
          
          await registerAdministrativeBreak(idUsuario, payload);

          setSuccessMessage('¡Pausa administrativa registrada correctamente!');

          setTimeout(() => {
            navigate('/app/administrativo/cronograma/pausas');
          }, 1500);

        } catch (error) {
          console.error('Error al registrar pausa:', error);
          
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
    navigate('/app/administrativo/cronograma/pausas'); // Regresa al listado de pausas
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto w-full max-w-[900px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="mb-[var(--space-5)] cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al historial de pausas
          </button>

          <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
            Cronograma
          </p>

          <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
            Registrar pausa administrativa
          </h1>

          <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
            Registra un periodo de pausa para un participante del cronograma.
          </p>

          <AdministrativePauseForm
            form={form}
            errors={errors}
            formError={formError}
            successMessage={successMessage}
            participantOptions={EMPTY_PARTICIPANT_OPTIONS}
            onChange={handleChange}
            onSubmit={handleFormSubmit}
            onCancel={handleBack}
          />
        </div>
      </main>
    </div>
  );
}