import { Leaf } from 'lucide-react';

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
    <div className="flex flex-col gap-[var(--space-5)] md:gap-[var(--space-6)]">
      <header className="flex items-start gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--brand-100)] bg-[var(--brand-50)] p-[var(--space-5)] md:p-[var(--space-6)]">
        <span
          className="hidden h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--surface-card)] text-[var(--brand-600)] min-[400px]:flex"
          aria-hidden="true"
        >
          <Leaf size={24} strokeWidth={1.7} />
        </span>

        <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-700)] uppercase">
            Tu espacio
          </p>

          <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
            Hola, {displayName}
          </h1>

          <p className="m-0 max-w-[560px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)] md:text-[length:var(--font-size-md)]">
            Aquí encuentras el contenido disponible en tu cronograma y el
            estado de tu cuenta. Avanza a tu ritmo.
          </p>
        </div>
      </header>

      <RegistrationStatusNotice
        view={registrationStatusView}
        estadoRegistro={estadoRegistro}
        onGoToConsent={goToConsent}
      />

      <CurrentContentAccessCard />

      <section
        aria-labelledby="modulos-programa-titulo"
        className="flex flex-col gap-[var(--space-3)]"
      >
        <div>
          <h2
            id="modulos-programa-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Módulos del programa
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            Estos módulos aún no están disponibles. Se habilitarán más
            adelante.
          </p>
        </div>

        <ModuleGrid />
      </section>
    </div>
  );
}
