import { ModuleGrid } from './components/ModuleGrid.jsx';
import { RegistrationStatusNotice } from './components/RegistrationStatusNotice.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';

import { CurrentContentAccessCard } from '@/features/cronograma/components/CurrentContentAccessCard/index.js';

/*
 * Encabezado, navegación y cierre de sesión los aporta el
 * StudentLayout. Aquí solo el contenido del inicio.
 */
export function StudentHomePage() {
  const {
    displayName,
    estadoRegistro,
    registrationStatusView,
    goToConsent,
  } = useStudentHomePage();

  return (
    <div className="flex flex-col gap-[var(--space-4)] md:gap-[var(--space-6)]">
      <header className="flex flex-col gap-[var(--space-1)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Tu espacio
        </p>

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Hola, {displayName}
        </h1>
      </header>

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
    </div>
  );
}
