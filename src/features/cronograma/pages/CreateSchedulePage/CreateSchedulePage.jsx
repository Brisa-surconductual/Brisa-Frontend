import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { ScheduleForm } from '@/features/cronograma/components/ScheduleForm/index.js';
import { crearCronograma } from '../../api/cronograma/crearCronograma';
import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB, ADMINISTRATIVE_TABS} from '@/shared/data/administrativeTabs.js';
import { useCreateScheduleForm } from './hooks/useCreateScheduleForm.js';

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
  const { role, logout } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleValidSubmit(formValues) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await crearCronograma(normalizeScheduleForm(formValues));
      navigate('/app/administrativo/cronograma');
    } catch (error) {
      setSubmitError('No pudimos crear el cronograma. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const { form, errors, handleChange, handleSubmit } = useCreateScheduleForm({
    onValidSubmit: handleValidSubmit,
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
    navigate('/app/administrativo/cronograma');
  }

  function handleCancel() {
    navigate('/app/administrativo/cronograma');
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto w-full max-w-[1200px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al cronograma
          </button>

          <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
            Administración
          </p>

          <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
            Crear cronograma
          </h1>

          <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
            Registra la información general del nuevo cronograma.
          </p>

          {submitError && (
            <p className="mt-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]">
              {submitError}
            </p>
          )}

          <div className="mt-[var(--space-6)]">
            <ScheduleForm
              form={form}
              errors={errors}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}