import { StudentBottomNav } from '@/features/users/components/StudentBottomNav/index.js';
import { StudentHeader } from '@/features/users/components/StudentHeader/index.js';

import { ModuleGrid } from './components/ModuleGrid.jsx';
import { RegistrationStatusNotice } from './components/RegistrationStatusNotice.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';

import { CurrentContentAccessCard } from '@/features/cronograma/components/CurrentContentAccessCard/index.js';

export function StudentHomePage() {
  const {
    displayName,
    roleLabel,
    estadoRegistro,
    registrationStatusView,
    goToConsent,
    handleLogout,
  } = useStudentHomePage();

  return (
    <div className="min-h-screen w-full bg-[var(--surface-bg)]">
      <div className="flex min-h-screen w-full flex-col bg-[var(--surface-bg)]">
        <StudentHeader
          displayName={displayName}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[var(--space-4)] p-[var(--space-4)] md:gap-[var(--space-6)] md:p-[var(--space-7)] lg:px-[var(--space-7)] lg:py-[var(--space-8)]">
          <RegistrationStatusNotice
            view={registrationStatusView}
            estadoRegistro={estadoRegistro}
            onGoToConsent={goToConsent}
          />

          <CurrentContentAccessCard />

          <h2 className="mt-[var(--space-1)] mb-0 text-[11px] font-bold tracking-[0.1em] text-[var(--text-secondary)] uppercase">
            Módulos del programa
          </h2>

          <ModuleGrid />
        </main>

        <StudentBottomNav activeItemId="inicio" />
      </div>
    </div>
  );
}