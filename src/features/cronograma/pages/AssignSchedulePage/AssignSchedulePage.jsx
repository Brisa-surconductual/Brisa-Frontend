import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';
import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { SearchableUserSelect } from '../../components/SearchableUserSelect/SearchableUserSelect.jsx'; 

import { assignScheduleToUser } from '../../api/cronograma/assingSchuldeToUser.jsx';
import { listSchedule } from '../../api/cronograma/listSchedule.jsx';

import { Calendar, CheckCircle2 } from 'lucide-react';

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
  const { role, logout } = useAuth();

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

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader roleLabel={role ?? 'ADMINISTRATIVO'} onLogout={handleLogout} />
      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="w-fit text-[13px] font-bold text-[var(--brand-600)]"
            onClick={() => navigate('/app/administrativo/cronograma')}
          >
            ← Volver a cronogramas
          </button>

          <header>
            <h1 className="m-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Asignar cronograma a usuario
            </h1>
            <p className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Selecciona el participante y el nuevo cronograma que cursará.
            </p>
          </header>

          {successMessage && (
            <div className="rounded-[var(--radius-md)] border border-green-200 bg-green-50 p-[var(--space-4)] text-[13px] font-semibold text-green-800">
              {successMessage}
            </div>
          )}

          {submitError && (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-6)]">
            
            {/* 1. BUSCADOR DE USUARIO */}
            <section className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-sm">
              <SearchableUserSelect 
                value={selectedUserId} 
                onChange={setSelectedUserId} 
              />
            </section>

            {/* 2. LISTA DE CRONOGRAMAS */}
            <section className="flex flex-col gap-[var(--space-4)]">
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
                Cronogramas disponibles <span className="text-[var(--danger-text)]">*</span>
              </h2>

              {loading ? (
                <p className="text-[13px] text-[var(--text-muted)]">Cargando cronogramas...</p>
              ) : loadError ? (
                <p className="text-[13px] text-[var(--danger-text)]">{loadError}</p>
              ) : schedules.length === 0 ? (
                <p className="text-[13px] text-[var(--text-muted)]">No hay cronogramas creados.</p>
              ) : (
                <div className="grid gap-[var(--space-3)]">
                  {schedules.map((schedule) => {
                    const scheduleId = schedule.idCronograma;
                    const isSelected = selectedScheduleId === scheduleId;

                    
                    return (
                      <article
                        key={scheduleId}
                        className={`flex items-center justify-between rounded-[var(--radius-md)] border p-[var(--space-4)] transition-all ${
                            isSelected
                            ? 'border-[var(--brand-500)] bg-[var(--brand-50)]'
                            : 'border-[var(--surface-border)] bg-[var(--surface-card)]'
                        }`}
                        >
                        <div className="flex items-start gap-3">
                          <Calendar className={`mt-1 h-5 w-5 ${isSelected ? 'text-[var(--brand-600)]' : 'text-[var(--text-muted)]'}`} />
                          <div>
                            <h3 className="m-0 text-[15px] font-bold text-[var(--text-primary)]">{schedule.nombreCronograma || 'Cronograma'}</h3>
                            <p className="m-0 text-[12px] text-[var(--text-muted)]">Estado: {schedule.estado}</p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant={isSelected ? 'primary' : 'secondary'}
                          size="small"
                          onClick={() => setSelectedScheduleId(scheduleId)}
                        >
                          {isSelected ? (
                            <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Seleccionado</span>
                          ) : (
                            'Seleccionar'
                          )}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. OPCIONES Y SUBMIT */}
            <section className="flex flex-col gap-[var(--space-5)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interrumpir}
                  onChange={(e) => setInterrumpir(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--surface-border)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                />
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">Interrumpir cronograma actual</span>
                  <span className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                    Si está marcado, el usuario abandonará su cronograma actual inmediatamente y comenzará el nuevo. 
                    Si está desmarcado, el nuevo cronograma iniciará automáticamente cuando termine la última unidad del actual.
                  </span>
                </div>
              </label>

              <div className="flex justify-end border-t border-[var(--surface-border)] pt-[var(--space-4)]">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedUserId || !selectedScheduleId}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </section>

          </form>
        </div>
      </main>
    </div>
  );
}