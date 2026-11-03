import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { PsychoeducationalContentList } from '@/features/cronograma/components/PsychoeducationalContentList/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { eliminarContenido } from '@/features/cronograma/api/contenido/eliminarContenido.jsx';
import { obtenerCatalogoContenidos } from '@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx';
import { mapCatalogContent } from '../../utils/contentPreparation.js';

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

const EMPTY_CONTENTS = Object.freeze([]);

export function ContentManagementPage() {
  const navigate = useNavigate();

  const [contents, setContents] = useState(EMPTY_CONTENTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadContents() {
      setLoading(true);
      setLoadError('');

      try {
        const data = await obtenerCatalogoContenidos();

        setContents(data.map(mapCatalogContent));
      } catch (error) {
        setLoadError(getApiErrorMessage(
          error,
          'No pudimos cargar los contenidos. Intenta nuevamente.',
        ));
      } finally {
        setLoading(false);
      }
    }

    void loadContents();
  }, []);

  const [pendingDeleteContent, setPendingDeleteContent] = useState(null);

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreate() {
    navigate('/app/administrativo/cronograma/contenidos/nuevo');
  }

  function handleManageResources(content) {
    navigate(
      `/app/administrativo/cronograma/contenidos/${encodeURIComponent(
        content.id,
      )}/recursos`,
      {
        state: {
          content,
        },
      },
    );
  }

  function handleEdit(content) {
    navigate(
      `/app/administrativo/cronograma/contenidos/${encodeURIComponent(
        content.id,
      )}/editar`,
      {
        state: {
          content,
        },
      },
    );
  }

  function handleRequestDelete(content) {
    setPendingDeleteContent(content);
  }

  function handleCancelDelete() {
    setPendingDeleteContent(null);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteContent) {
      return;
    }

    const contentId = pendingDeleteContent.id;

    try {
      await eliminarContenido(contentId);

      setContents((currentContents) =>
        currentContents.filter((content) => content.id !== contentId),
      );
      setLoadError('');
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error, 
        'No pudimos eliminar el contenido. Verifica su estado e intenta nuevamente.'
      );
      setLoadError(errorMessage);
    } finally {
      setPendingDeleteContent(null);
    }
  }

  // Un fallo de carga no se presenta como catálogo vacío.
  const showEmptyState = !loadError || contents.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>Volver a cronogramas</BackButton>

      <SchedulePageHeader
        eyebrow="Administración · Cronogramas"
        title="Contenidos psicoeducativos"
        description="Consulta y administra los contenidos disponibles para el cronograma."
        actions={
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Crear contenido
          </Button>
        }
      />

      {loadError && (
        <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
          {loadError}
        </PanelNotice>
      )}

      <section
        aria-labelledby="catalogo-contenidos-titulo"
        aria-busy={loading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div className="flex items-baseline justify-between gap-[var(--space-3)]">
          <h2
            id="catalogo-contenidos-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Catálogo
          </h2>

          {!loading && (
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
              {contents.length}{' '}
              {contents.length === 1 ? 'contenido' : 'contenidos'}
            </p>
          )}
        </div>

        {loading ? (
          <>
            <p role="status" className="sr-only">
              Cargando contenidos...
            </p>
            <div className="grid gap-[var(--space-4)] md:grid-cols-2" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-[260px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                />
              ))}
            </div>
          </>
        ) : showEmptyState ? (
          <PsychoeducationalContentList
            contents={contents}
            onManageResources={handleManageResources}
            onEdit={handleEdit}
            onDelete={handleRequestDelete}
          />
        ) : null}
      </section>

      <ConfirmationDialog
        open={Boolean(pendingDeleteContent)}
        title="Eliminar contenido"
        description={
          pendingDeleteContent
            ? `¿Deseas eliminar "${pendingDeleteContent.name}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
