import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { CurrentContentCard } from '@/features/cronograma/components/CurrentContentCard/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

import { StudentBottomNav } from '@/features/users/components/StudentBottomNav/index.js';
import { StudentHeader } from '@/features/users/components/StudentHeader/index.js';

import { obtenerMiContenidoVigente } from '@/features/cronograma/api/contenidoVigente/obtenerMiContenidoVigente.jsx';

const EMPTY_CURRENT_CONTENT = Object.freeze([]);

function formatAvailability(start, end) {
  if (!start || !end) {
    return '';
  }

  return `${new Date(start).toLocaleString()} → ${new Date(end).toLocaleString()}`;
}

function mapCurrentContent(content) {
  return {
    id: content.id_contenido,
    associationId: content.id_contenido_cronograma,
    name: content.nombre_contenido,
    type: content.tipo_contenido,
    temporalUnitId: content.id_unidad_temporal,
    temporalUnitName: content.nombre_unidad,
    temporalUnitOrder: content.orden_unidad,
    order: content.orden_contenido,
    status: content.estado_disponibilidad,
    availabilityText: formatAvailability(
      content.fecha_inicio_disponibilidad,
      content.fecha_fin_disponibilidad,
    ),
  };
}

export function CurrentContentPage({
  onSelectContent,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [currentContent, setCurrentContent] = useState(
    EMPTY_CURRENT_CONTENT,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentContent() {
      try {
        const data = await obtenerMiContenidoVigente();

        if (!isMounted) {
          return;
        }

        setCurrentContent(
          Array.isArray(data)
            ? data.map(mapCurrentContent)
            : [],
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 404) {
          setCurrentContent([]);
          return;
        }

        setLoadError(
          'No pudimos consultar tu contenido vigente. Intenta nuevamente.',
        );
      }finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCurrentContent();

    return () => {
      isMounted = false;
    };
  }, []);

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

          {loading ? (
            <p
              className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando contenido vigente...
            </p>
          ) : loadError ? (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
            </div>
          ) : currentContent.length > 0 ? (
            <section
              className="grid gap-[var(--space-4)]"
              aria-label="Contenido vigente"
            >
              {currentContent.map((content) => (
                <CurrentContentCard
                  key={content.associationId ?? content.id}
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