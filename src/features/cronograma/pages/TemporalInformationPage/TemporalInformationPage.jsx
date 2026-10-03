import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';
import { TemporalInformationSummary } from '@/features/cronograma/components/TemporalInformationSummary/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

const EMPTY_TEMPORAL_INFORMATION = null;
const EMPTY_CURRENT_CONTENT = Object.freeze([]);

export function TemporalInformationPage({
  temporalInformation = EMPTY_TEMPORAL_INFORMATION,
  currentContent = EMPTY_CURRENT_CONTENT,
  onSelectContent,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
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
    navigate('/app/administrativo/cronograma/progreso');
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel="Administrativo"
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al progreso
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Cronograma
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Información temporal
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta la ubicación temporal del participante y los contenidos
              vigentes asociados a su momento actual dentro del cronograma.
            </p>
          </header>

          {temporalInformation ? (
            <>
              <TemporalInformationSummary
                participantName={temporalInformation.participantName}
                temporalUnitName={temporalInformation.temporalUnitName}
                temporalUnitOrder={temporalInformation.temporalUnitOrder}
                calculationDateText={temporalInformation.calculationDateText}
                elapsedTimeText={temporalInformation.elapsedTimeText}
                completed={temporalInformation.completed}
                message={temporalInformation.message}
              />

              <section aria-labelledby="current-content-title">
                <h2
                  id="current-content-title"
                  className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
                >
                  Contenidos vigentes
                </h2>

                {currentContent.length > 0 ? (
                  <div className="mt-[var(--space-3)] grid gap-[var(--space-4)]">
                    {currentContent.map((content) => (
                      <CurrentContentCard
                        key={content.id}
                        content={content}
                        onSelect={onSelectContent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-[var(--space-3)]">
                    <EmptyScheduleState
                      title="No hay contenido vigente"
                      description="El participante no tiene contenido disponible para su ubicación temporal actual."
                    />
                  </div>
                )}
              </section>
            </>
          ) : (
            <EmptyScheduleState
              title="No hay información temporal disponible"
              description="Cuando exista información temporal del participante, aparecerá en esta vista."
            />
          )}
        </div>
      </main>
    </div>
  );
}