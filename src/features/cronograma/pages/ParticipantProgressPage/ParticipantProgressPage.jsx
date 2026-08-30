import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { ParticipantProgressSummary } from '@/features/cronograma/components/ParticipantProgressSummary/index.js';

import { ParticipantProgressList } from '@/features/cronograma/components/ParticipantProgressList/index.js';

import { CompletedParticipantProgress } from '@/features/cronograma/components/CompletedParticipantProgress/index.js';

const EMPTY_PROGRESS_SUMMARY = null;
const EMPTY_PARTICIPANTS = Object.freeze([]);
const EMPTY_COMPLETED_PARTICIPANT = null;
export function ParticipantProgressPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const progressSummary = EMPTY_PROGRESS_SUMMARY;

  const participants = EMPTY_PARTICIPANTS;

  const completedParticipant = EMPTY_COMPLETED_PARTICIPANT;

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
    navigate('/app/administrativo/cronograma');
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
            ← Volver al cronograma
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Cronograma
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Progreso por usuario
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta la ubicación y el progreso temporal de los participantes
              dentro del cronograma.
            </p>
          </header>
          <ParticipantProgressSummary summary={progressSummary} />

          {participants.length > 0 ? (
            <ParticipantProgressList participants={participants} />
          ) : (
            <section
              className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-8)] text-center"
              aria-label="Progreso de participantes"
            >
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
                No hay información de progreso para mostrar
              </h2>

              <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[560px] text-[12px] leading-[1.6] text-[var(--text-muted)]">
                Cuando exista información de progreso de los participantes,
                aparecerá en esta vista.
              </p>
            </section>
          )}
          {completedParticipant ? (
            <CompletedParticipantProgress
              participantName={completedParticipant.participantName}
              email={completedParticipant.email}
              completedWeeks={completedParticipant.completedWeeks}
              totalWeeks={completedParticipant.totalWeeks}
              completedDays={completedParticipant.completedDays}
              totalDays={completedParticipant.totalDays}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
