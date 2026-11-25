import { ModuleGrid } from './components/ModuleGrid.jsx';
import { ProgramStatusSection } from './components/ProgramStatusSection.jsx';
import { RegistrationStatusNotice } from './components/RegistrationStatusNotice.jsx';
import { TherapeuticSpaceCard } from './components/TherapeuticSpaceCard.jsx';
import { STUDENT_TOOL_MODULES } from './data/studentModules.js';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';

import { CurrentContentAccessCard } from '@/features/cronograma/components/CurrentContentAccessCard/index.js';

// Texto real de la cuadrícula: hoy ninguna herramienta tiene pantalla.
const TOOLS_UPCOMING = STUDENT_TOOL_MODULES.every(({ to }) => !to);

/*
 * Inicio del estudiante. Encabezado, navegación, cierre de sesión y
 * botón SOS los aporta el StudentLayout. Orden (una columna en móvil):
 * bienvenida → tu espacio terapéutico (acción principal) → estado del
 * programa → tu contenido actual → otras herramientas. Si el registro
 * no está confirmado, su aviso completo va antes del chat: tiene
 * prioridad y el chat no se presenta como acceso garantizado.
 */
export function StudentHomePage() {
  const {
    displayName,
    estadoRegistro,
    registrationStatusView,
    accessConfirmed,
    goToConsent,
  } = useStudentHomePage();

  return (
    <div className="flex flex-col gap-[var(--space-5)] md:gap-[var(--space-6)]">
      <header className="flex flex-col gap-[var(--space-1)]">
        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Hola, {displayName}
        </h1>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)] md:text-[length:var(--font-size-md)]">
          Este es tu espacio para avanzar a tu ritmo.
        </p>
      </header>

      {!accessConfirmed && (
        <RegistrationStatusNotice
          view={registrationStatusView}
          estadoRegistro={estadoRegistro}
          onGoToConsent={goToConsent}
        />
      )}

      <TherapeuticSpaceCard accessConfirmed={accessConfirmed} />

      <div className="grid grid-cols-1 gap-[var(--space-5)] md:gap-[var(--space-6)] lg:grid-cols-2 lg:items-stretch">
        <ProgramStatusSection
          showRegistration={accessConfirmed}
          view={registrationStatusView}
          estadoRegistro={estadoRegistro}
          onGoToConsent={goToConsent}
        />

        <CurrentContentAccessCard variant="compact" />
      </div>

      <section
        aria-labelledby="otras-herramientas-titulo"
        className="flex flex-col gap-[var(--space-3)]"
      >
        <div>
          <h2
            id="otras-herramientas-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Otras herramientas para ti
          </h2>
          {TOOLS_UPCOMING && (
            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              Estas herramientas aún no están disponibles. Se habilitarán más
              adelante.
            </p>
          )}
        </div>

        <ModuleGrid />
      </section>
    </div>
  );
}
