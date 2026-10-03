import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

import { StudentBottomNav } from '@/features/users/components/StudentBottomNav/index.js';
import { StudentHeader } from '@/features/users/components/StudentHeader/index.js';

const EMPTY_CURRENT_CONTENT = Object.freeze([]);

export function CurrentContentPage({
  currentContent = EMPTY_CURRENT_CONTENT,
  onSelectContent,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleBack() {
    navigate('/app/estudiante');
  }

  const displayName =
    user?.name ??
    user?.email ??
    'Estudiante';

  return (
    <div className="min-h-screen w-full bg-[var(--surface-bg)]">
      <div className="flex min-h-screen w-full flex-col bg-[var(--surface-bg)]">
        <StudentHeader
          displayName={displayName}
          roleLabel="Estudiante"
          onLogout={handleLogout}
        />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[var(--space-5)] p-[var(--space-4)] md:p-[var(--space-7)]">
          <button
            type="button"
            className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al inicio
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Tu programa
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Contenido vigente
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Consulta el contenido que se encuentra disponible actualmente
              dentro de tu cronograma.
            </p>
          </header>

          {currentContent.length > 0 ? (
            <section
              className="grid gap-[var(--space-4)]"
              aria-label="Contenido vigente"
            >
              {currentContent.map((content) => (
                <CurrentContentCard
                  key={content.id}
                  content={content}
                  onSelect={onSelectContent}
                />
              ))}
            </section>
          ) : (
            <EmptyScheduleState
              title="No hay contenido vigente"
              description="Cuando exista contenido disponible para tu momento actual dentro del cronograma, aparecerá en esta sección."
            />
          )}
        </main>

        <StudentBottomNav activeItemId="inicio" />
      </div>
    </div>
  );
}