import { CircleCheck } from 'lucide-react';

import { StudentBottomNav } from '@/features/users/components/StudentBottomNav/index.js';
import { StudentHeader } from '@/features/users/components/StudentHeader/index.js';

import { ModuleGrid } from './components/ModuleGrid.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';

export function StudentHomePage() {
  const { displayName, roleLabel, handleLogout } = useStudentHomePage();

  return (
    <div className="min-h-screen w-full bg-[var(--surface-bg)]">
      <div className="flex min-h-screen w-full flex-col bg-[var(--surface-bg)]">
        <StudentHeader
          displayName={displayName}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[var(--space-4)] p-[var(--space-4)] md:gap-[var(--space-6)] md:p-[var(--space-7)] lg:px-[var(--space-7)] lg:py-[var(--space-8)]">
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-3)] text-[var(--success-text)] md:p-[var(--space-4)]">
            <CircleCheck size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

            <div>
              <strong className="block text-[13px] md:text-[14px]">
                ¡Registro completado!
              </strong>

              <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] opacity-90 md:text-[13px]">
                Tu programa psicoeducativo está listo. Los módulos se habilitarán según tu progreso.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-[var(--space-3)]">
            <span className="text-[13px] font-bold text-[var(--text-primary)] md:text-[14px]">
              Estado de tu cuenta
            </span>

            {/*
             * Valor fijo por ahora: la sesión solo lleva
             * correo y rol. Debe leerse de `estado_registro`
             * cuando este viaje en la sesión.
             */}
            <span className="inline-flex items-center gap-[var(--space-1)] whitespace-nowrap rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-2)] py-[3px] font-[var(--font-mono)] text-[10px] font-bold text-[var(--success-text)]">
              <span className="h-[6px] w-[6px] shrink-0 rounded-[var(--radius-full)] bg-[var(--success)]" aria-hidden="true" />
              REGISTRO_COMPLETO
            </span>
          </div>

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