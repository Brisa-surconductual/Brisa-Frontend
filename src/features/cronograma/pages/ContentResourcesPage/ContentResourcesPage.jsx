import { useEffect, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { PsychoeducationalResourceForm } from '@/features/cronograma/components/PsychoeducationalResourceForm/index.js';
import { PsychoeducationalResourceList } from '@/features/cronograma/components/PsychoeducationalResourceList/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { usePsychoeducationalResourceForm } from './hooks/usePsychoeducationalResourceForm.js';

import { obtenerCatalogoContenidos } from '@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx';
import { listarModulosDestino } from '@/features/cronograma/api/recursoContenido/listarModulosDestino.jsx';
import { listarRecursosContenido } from '@/features/cronograma/api/recursoContenido/listarRecursosContenido.jsx';

import { crearRecursoContenido } from '@/features/cronograma/api/recursoContenido/crearRecursoContenido.jsx';
import { solicitarUrlSubidaRecurso } from '@/features/cronograma/api/recursoContenido/solicitarUrlSubidaRecurso.jsx';
import { subirRecursoFirmado } from '@/features/cronograma/api/recursoContenido/subirRecursoFirmado.jsx';

import { PSYCHOEDUCATIONAL_RESOURCE_TYPE } from '@/features/cronograma/types/resourceTypes.js';

import { reordenarRecursosContenido } from '@/features/cronograma/api/recursoContenido/reordenarRecursosContenido.jsx';

const EMPTY_RESOURCES = Object.freeze([]);
const EMPTY_DESTINATION_MODULES = Object.freeze([]);

function mapResource(resource) {
  return {
    id: resource.idRecurso,
    type: resource.tipoRecurso,
    order: resource.ordenBloque,
    textContent: resource.textoContenido,
    storageKey: resource.claveAlmacenamiento,
    mimeType: resource.mimeType,
    sizeBytes: resource.tamanoBytes,
    durationSeconds: resource.duracionSegundos,
    alternativeText: resource.textoAlternativo,
    moduleIds: resource.idModulos,
  };
}

export function ContentResourcesPage({
  content: contentProp,
  onDeleteResource,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId } = useParams();
  const { role, logout } = useAuth();
  const editorSectionRef = useRef(null);

  const [loadedContent, setLoadedContent] = useState(null);
  const [resources, setResources] = useState(EMPTY_RESOURCES);
  const [destinationModules, setDestinationModules] = useState(
    EMPTY_DESTINATION_MODULES,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const navigationContent =
    location.state?.content ?? null;

  const content =
    contentProp ?? navigationContent ?? loadedContent;

  const canManage = content?.canEdit === true;

  useEffect(() => {
    async function loadResourceData() {
      if (!contentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        const [catalog, modules, resourceData] =
          await Promise.all([
            obtenerCatalogoContenidos(),
            listarModulosDestino(),
            listarRecursosContenido(contentId),
          ]);

        const catalogContent = catalog.find(
          (item) => item.idContenido === contentId,
        );

        if (catalogContent) {
          setLoadedContent({
            id: catalogContent.idContenido,
            name: catalogContent.nombre,
            type: catalogContent.tipoContenido,
            associated: catalogContent.asociado,
            associationId:
              catalogContent.idAsociasionUnidadTemporalContenido,
            canEdit: true,
            canDelete: true,
          });
        }

        setDestinationModules(
          modules.map((module) => ({
            id: module.id_modulo,
            code: module.codigo_modulo,
            name: module.nombre_modulo,
          })),
        );

        setResources(resourceData.map(mapResource));
      } catch {
        setLoadError(
          'No pudimos cargar los recursos del contenido. Intenta nuevamente.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadResourceData();
  }, [contentId]);

  const [
    editingResource,
    setEditingResource,
  ] = useState(null);

  const [
    pendingDeleteResource,
    setPendingDeleteResource,
  ] = useState(null);

  const [formSession, setFormSession] =
    useState(0);

  async function handleValidSubmit(payload) {
    const currentContentId = content?.id ?? contentId;

    if (!currentContentId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (
        payload.type ===
        PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO
      ) {
        await crearRecursoContenido({
          contentId: currentContentId,
          type: payload.type,
          order: payload.order,
          textContent: payload.textContent,
          moduleIds: payload.moduleIds,
        });
      } else {
        if (!payload.file?.type) {
          throw new Error('El archivo no tiene un tipo MIME válido.');
        }

        const uploadData =
          await solicitarUrlSubidaRecurso({
            contentId: currentContentId,
            type: payload.type,
            mimeType: payload.file.type,
            sizeBytes: payload.file.size,
          });

        await subirRecursoFirmado({
          uploadUrl: uploadData.url_subida,
          method: uploadData.metodo,
          headers: uploadData.encabezados,
          file: payload.file,
        });

        await crearRecursoContenido({
          contentId: currentContentId,
          type: payload.type,
          order: payload.order,
          storageKey: uploadData.clave_almacenamiento,
          mimeType: payload.file.type,
          sizeBytes: payload.file.size,
          moduleIds: payload.moduleIds,
        });
      }

      const updatedResources =
        await listarRecursosContenido(currentContentId);

      setResources(updatedResources.map(mapResource));

      resetEditor();
    } catch {
      setSubmitError(
        'No pudimos guardar el recurso. Verifica la información e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const {
    form,
    errors,
    handleChange,
    handleFileChange,
    handleModuleToggle,
    handleSubmit,
    resetForm,
  } = usePsychoeducationalResourceForm({
    onValidSubmit: handleValidSubmit,
  });

  function resetEditor() {
    setEditingResource(null);
    resetForm();
    setFormSession((current) => current + 1);
  }

  async function handleMoveResource(resource, direction) {
    const currentContentId = content?.id ?? contentId;

    if (!currentContentId || isSubmitting) {
      return;
    }

    const orderedResources = [...resources].sort(
      (firstResource, secondResource) =>
        firstResource.order - secondResource.order,
    );

    const currentIndex = orderedResources.findIndex(
      (currentResource) =>
        currentResource.id === resource.id,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= orderedResources.length
    ) {
      return;
    }

    [
      orderedResources[currentIndex],
      orderedResources[targetIndex],
    ] = [
      orderedResources[targetIndex],
      orderedResources[currentIndex],
    ];

    const reorderedResources = orderedResources.map(
      (currentResource, index) => ({
        ...currentResource,
        order: index + 1,
      }),
    );

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await reordenarRecursosContenido({
        contentId: currentContentId,
        resourceIds: reorderedResources.map(
          (currentResource) => currentResource.id,
        ),
      });

      setResources(reorderedResources);
    } catch {
      setSubmitError(
        'No pudimos actualizar el orden de los recursos. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleMoveUp(resource) {
    handleMoveResource(resource, 'up');
  }

  function handleMoveDown(resource) {
    handleMoveResource(resource, 'down');
  }

  function handleEdit(resource) {
    if (!canManage) {
      return;
    }

    setEditingResource(resource);
    resetForm(resource);
    setFormSession((current) => current + 1);

    editorSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function handleRequestDelete(resource) {
    if (!canManage) {
      return;
    }

    setPendingDeleteResource(resource);
  }

  function handleCancelDelete() {
    setPendingDeleteResource(null);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteResource) {
      return;
    }

    onDeleteResource?.(pendingDeleteResource);
    setPendingDeleteResource(null);
  }

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (
      tabId ===
      ADMINISTRATIVE_TAB.CRONOGRAMA
    ) {
      navigate(
        '/app/administrativo/cronograma',
      );
      return;
    }

    if (
      tabId ===
      ADMINISTRATIVE_TAB.DASHBOARD
    ) {
      navigate('/app/administrativo');
      return;
    }

    navigate(
      `/app/administrativo?tab=${encodeURIComponent(
        tabId,
      )}`,
    );
  }

  function handleBack() {
    navigate(
      '/app/administrativo/cronograma/contenidos',
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={
          ADMINISTRATIVE_TAB.CRONOGRAMA
        }
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="w-fit text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver a contenidos
          </button>

          <header>
            <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
              Recursos psicoeducativos
            </p>

            <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
              Gestionar recursos
            </h1>

            <p className="mt-[var(--space-2)] mb-0 max-w-[720px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
              Administra los bloques de texto y los
              recursos multimedia que componen el
              contenido psicoeducativo.
            </p>
          </header>

          {loadError && (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
            </div>
          )}

          {!content ? (
            <section className="rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)]">
              <h2 className="m-0 text-[17px] font-extrabold text-[var(--text-primary)]">
                Contenido no disponible
              </h2>

              <p className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-muted)]">
                No se recibió la información del
                contenido seleccionado.
                {contentId
                  ? ` Identificador: ${contentId}.`
                  : ''}
              </p>
            </section>
          ) : (
            <>
              <section className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
                <p className="m-0 text-[11px] font-bold tracking-[0.04em] text-[var(--text-muted)] uppercase">
                  Contenido seleccionado
                </p>

                <h2 className="mt-[var(--space-1)] mb-0 text-[18px] font-extrabold text-[var(--text-primary)]">
                  {content.name}
                </h2>

                {!canManage && (
                  <p className="mt-[var(--space-2)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
                    Los recursos de este contenido
                    están disponibles únicamente para
                    consulta.
                  </p>
                )}
              </section>

              {canManage && (
                <section ref={editorSectionRef}
                  className="scroll-mt-[160px]"
                  >
                  <div className="mb-[var(--space-4)] flex flex-wrap items-center justify-between gap-[var(--space-3)]">
                    <div>
                      <h2 className="m-0 text-[18px] font-extrabold text-[var(--text-primary)]">
                        {editingResource
                          ? 'Editar recurso'
                          : 'Agregar recurso'}
                      </h2>

                      <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
                        {editingResource
                          ? `Modificando el bloque ${editingResource.order}.`
                          : 'Agrega un nuevo bloque al contenido.'}
                      </p>
                    </div>

                    {editingResource && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={resetEditor}
                      >
                        Cancelar edición
                      </Button>
                    )}
                  </div>

                  {submitError && (
                    <div
                      className="mb-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
                      role="alert"
                    >
                      {submitError}
                    </div>
                  )}

                  <PsychoeducationalResourceForm
                    key={formSession}
                    form={form}
                    errors={errors}
                    destinationModules={destinationModules}
                    loading={loading || isSubmitting}
                    submitLabel={
                      editingResource
                        ? 'Guardar cambios'
                        : 'Agregar recurso'
                    }
                    onChange={handleChange}
                    onFileChange={
                      handleFileChange
                    }
                    onModuleToggle={handleModuleToggle}
                    onSubmit={handleSubmit}
                    onCancel={resetEditor}
                  />
                </section>
              )}

              <section>
                <div className="mb-[var(--space-4)]">
                  <h2 className="m-0 text-[18px] font-extrabold text-[var(--text-primary)]">
                    Bloques del contenido
                  </h2>

                  <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
                    Los recursos se presentan según
                    su orden de bloque.
                  </p>
                </div>

                {loading ? (
                  <p
                    className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
                    role="status"
                  >
                    Cargando recursos...
                  </p>
                ) : (
                  <PsychoeducationalResourceList
                    resources={resources}
                    destinationModules={destinationModules}
                    canManage={canManage}
                    canReorder={canManage && !isSubmitting}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onEdit={handleEdit}
                    onDelete={
                      handleRequestDelete
                    }
                  />
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <ConfirmationDialog
        open={Boolean(pendingDeleteResource)}
        title="Eliminar recurso"
        description={
          pendingDeleteResource
            ? `¿Deseas eliminar el bloque ${pendingDeleteResource.order}? Esta acción no se puede deshacer.`
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