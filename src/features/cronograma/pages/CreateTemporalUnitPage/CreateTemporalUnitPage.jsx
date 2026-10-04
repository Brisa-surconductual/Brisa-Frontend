import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB, ADMINISTRATIVE_TABS } from '@/shared/data/administrativeTabs.js';

import { TemporalUnitForm } from '@/features/cronograma/components/TemporalUnitForm/index.js';
import { useCreateTemporalUnitForm } from './hooks/useCreateTemporalUnitForm.js';
import { crearUnidadTemporal } from '@/features/cronograma/api/unidadTemporal/crearUnidadTemporal.jsx';

export function CreateTemporalUnitPage() {
  const navigate = useNavigate();
  const { idSchedule } = useParams(); 
  const location = useLocation(); // Rescatamos la memoria de React Router
  const { role, logout } = useAuth();
  
  // Extraemos el schedule que viene del panel para no perderlo
  const schedule = location.state?.schedule;
  
  // Estado para controlar nuestra alerta visual de éxito
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { form, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useCreateTemporalUnitForm({
      onValidSubmit: handleValidSubmit 
    });

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleValidSubmit(formValues) {
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
          navigate(`/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/panel`, {
            state: { schedule } // ¡ESTO ARREGLA LA REDIRECCIÓN!
          });
        }, 2000);
      })
      .catch((error) => {
        const backendMessage = error.response?.data?.message 
                            || error.response?.data?.error 
                            || 'Revisa los datos. El servidor rechazó la solicitud (Error 400).';
        throw new Error(backendMessage); 
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
    // Si cancela, también le devolvemos su schedule al panel
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/panel`, {
      state: { schedule }
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 relative">
        <div className="mx-auto w-full max-w-[680px] px-[var(--space-4)] py-[var(--space-8)] md:px-[var(--space-7)] md:py-[var(--space-12)]">
          
          {/* PANTALLA DE ÉXITO (Se muestra si isSuccess es true) */}
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-[var(--space-12)] text-center animate-fade-in">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)] mb-6 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[24px] font-extrabold text-[var(--text-primary)] m-0">
                ¡Unidad creada con éxito!
              </h2>
              <p className="mt-3 text-[15px] text-[var(--text-muted)]">
                Redirigiendo al panel del cronograma...
              </p>
            </div>
          ) : (
            /* FORMULARIO NORMAL (Se oculta cuando hay éxito) */
            <>
              <button
                type="button"
                className="mb-[var(--space-8)] flex items-center text-[13px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                onClick={handleBack}
              >
                <span className="mr-2 text-[16px]">←</span> Regresar al panel del cronograma
              </button>

              <header className="mb-[var(--space-8)]">
                <h1 className="m-0 text-[32px] font-extrabold tracking-tight text-[var(--text-primary)] md:text-[40px]">
                  Nueva Unidad Temporal
                </h1>
                <p className="mt-[var(--space-3)] mb-0 text-[15px] leading-relaxed text-[var(--text-muted)]">
                  Define el nombre y el periodo de tiempo asignado para esta fase del cronograma.
                </p>
              </header>

              {submitError && (
                <div className="mb-[var(--space-8)] rounded-md bg-[var(--danger-50)] p-4 border-l-4 border-[var(--danger-500)]">
                  <p className="m-0 text-[14px] font-medium text-[var(--danger-700)]">
                    {submitError}
                  </p>
                </div>
              )}

              <div className="mt-[var(--space-4)]">
                <TemporalUnitForm
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={handleBack}
                  submitLoading={isSubmitting}
                />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}