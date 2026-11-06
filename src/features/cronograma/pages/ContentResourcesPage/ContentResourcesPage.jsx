import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  Eye,
  ListChecks,
  SearchX,
  X,
} from 'lucide-react';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { PsychoeducationalResourceForm } from '@/features/cronograma/components/PsychoeducationalResourceForm/index.js';
import { PsychoeducationalResourceList } from '@/features/cronograma/components/PsychoeducationalResourceList/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { StatusChip } from '@/features/cronograma/components/StatusChip/index.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { usePsychoeducationalResourceForm } from './hooks/usePsychoeducationalResourceForm.js';

import { obtenerCatalogoContenidos } from '@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx';
import { listarModulosDestino } from '@/features/cronograma/api/recursoContenido/listarModulosDestino.jsx';
import { listarRecursosContenido } from '@/features/cronograma/api/recursoContenido/listarRecursosContenido.jsx';

import { crearRecursoContenido } from '@/features/cronograma/api/recursoContenido/crearRecursoContenido.jsx';
import { solicitarUrlSubidaRecurso } from '@/features/cronograma/api/recursoContenido/solicitarUrlSubidaRecurso.jsx';
import { subirRecursoFirmado } from '@/features/cronograma/api/recursoContenido/subirRecursoFirmado.jsx';

import {
  PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL,
} from '@/features/cronograma/types/contentTypes.js';
import { PSYCHOEDUCATIONAL_RESOURCE_TYPE } from '@/features/cronograma/types/resourceTypes.js';

import { reordenarRecursosContenido } from '@/features/cronograma/api/recursoContenido/reordenarRecursosContenido.jsx';

import { actualizarRecursoContenido } from '@/features/cronograma/api/recursoContenido/actualizarRecursoContenido.jsx';
import { eliminarRecursoContenido } from '@/features/cronograma/api/recursoContenido/eliminarRecursoContenido.jsx';
import { getApiErrorMessage } from '../../utils/apiErrorMessage.js';
import { contentFormReturnPath } from '../../utils/contentFormReturnPath.js';
import {
  mapCatalogContent,
  resourcesAreReady,
} from '../../utils/contentPreparation.js';

const CARD_CLASS =
  'rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)]';

const EMPTY_RESOURCES = Object.freeze([]);
const EMPTY_DESTINATION_MODULES = Object.freeze([]);

function mapResource(resource) {
  return {
    id: resource.id_recurso,
    contentId: resource.id_contenido,
    type: resource.tipo_recurso,
    order: resource.orden_bloque,
    textContent: resource.texto_contenido,
    storageKey: resource.clave_almacenamiento,
    mimeType: resource.mime_type,
    sizeBytes: resource.tamano_bytes,
    durationSeconds: resource.duracion_segundos,
    alternativeText: resource.texto_alternativo,
    moduleIds: resource.id_modulos,
    createdAt: resource.fecha_creacion,
  };
}
export function ContentResourcesPage({ content: contentProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId } = useParams();
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

  const navigationContent = location.state?.content ?? null;

  const content =
    loadedContent?.id === contentId
      ? loadedContent
      : (contentProp ?? navigationContent);
  const canManage =
    !loading &&
    !loadError &&
    loadedContent?.id === contentId &&
    loadedContent.canEdit === true;
  const resourcesReady = resourcesAreReady(resources, destinationModules);

  useEffect(() => {
    async function loadResourceData() {
      if (!contentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        const [catalog, modules, resourceData] = await Promise.all([
          obtenerCatalogoContenidos(),
          listarModulosDestino(),
          listarRecursosContenido(contentId),
        ]);

        const catalogContent = catalog.find(
          (item) => item.idContenido === contentId,
        );

        if (catalogContent) {
          setLoadedContent(mapCatalogContent(catalogContent));
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

    void loadResourceData();
  }, [contentId]);

  const [editingResource, setEditingResource] = useState(null);

  const [pendingDeleteResource, setPendingDeleteResource] = useState(null);

  const [formSession, setFormSession] = useState(0);

  async function handleValidSubmit(payload) {
    if (!canManage || isSubmitting) return;
    const currentContentId = content?.id ?? contentId;

    if (!currentContentId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (editingResource) {
        if (editingResource.type === PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO) {
          await actualizarRecursoContenido({
            resourceId: editingResource.id,
            textContent: payload.textContent,
            moduleIds: payload.moduleIds,
          });
        } else if (payload.file) {
          if (!payload.file.type) {
            throw new Error('El archivo no tiene un tipo MIME válido.');
          }

          const uploadData = await solicitarUrlSubidaRecurso({
            contentId: currentContentId,
            type: editingResource.type,
            mimeType: payload.file.type,
            sizeBytes: payload.file.size,
          });

          await subirRecursoFirmado({
            uploadUrl: uploadData.url_subida,
            method: uploadData.metodo,
            headers: uploadData.encabezados,
            file: payload.file,
          });

          await actualizarRecursoContenido({
            resourceId: editingResource.id,
            moduleIds: payload.moduleIds,
            storageKey: uploadData.clave_almacenamiento,
            mimeType: payload.file.type,
            sizeBytes: payload.file.size,
          });
        } else {
          await actualizarRecursoContenido({
            resourceId: editingResource.id,
            moduleIds: payload.moduleIds,
          });
        }
      } else if (payload.type === PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO) {
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

        const uploadData = await solicitarUrlSubidaRecurso({
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

      const updatedResources = await listarRecursosContenido(currentContentId);

      setResources(updatedResources.map(mapResource));

      resetEditor();
    } catch (error) {
      if (editingResource && error.response?.status === 403) {
        setSubmitError(
          getApiErrorMessage(
            error, 
            'No se puede modificar este recurso.'
          )
        );

        resetEditor();
        return;
      }

      const fallbackMessage = editingResource
        ? 'No pudimos actualizar el recurso. Verifica la información e intenta nuevamente.'
        : 'No pudimos guardar el recurso. Verifica la información e intenta nuevamente.';

      setSubmitError(getApiErrorMessage(error, fallbackMessage));
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
    resources,
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
      (currentResource) => currentResource.id === resource.id,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedResources.length) {
      return;
    }

    [orderedResources[currentIndex], orderedResources[targetIndex]] = [
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
    void handleMoveResource(resource, 'up');
  }

  function handleMoveDown(resource) {
    void handleMoveResource(resource, 'down');
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

  async function handleConfirmDelete() {
    if (!pendingDeleteResource || isSubmitting) {
      return;
    }

    const currentContentId = content?.id ?? contentId;

    if (!currentContentId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await eliminarRecursoContenido(pendingDeleteResource.id);

      const updatedResources = await listarRecursosContenido(currentContentId);

      setResources(updatedResources.map(mapResource));

      setPendingDeleteResource(null);
    } catch {
      setSubmitError('No pudimos eliminar el recurso. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    navigate(contentFormReturnPath(location.state?.returnToAssociation));
  }

  const fromAssociation = Boolean(location.state?.returnToAssociation);
  const contentTypeLabel = content
    ? (PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[content.type] ?? content.type)
    : '';

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <BackButton onClick={handleBack}>
        {fromAssociation
          ? 'Volver a la unidad temporal'
          : 'Volver a contenidos'}
      </BackButton>

      <SchedulePageHeader
        eyebrow="Recursos psicoeducativos"
        title="Gestionar recursos"
        description="Administra los bloques de texto y los recursos multimedia que componen el contenido psicoeducativo."
      />

      {loadError && (
        <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
          {loadError}
        </PanelNotice>
      )}

      {location.state?.creationFlow && (
        <section
          aria-labelledby="paso-recursos-titulo"
          className={`${CARD_CLASS} flex flex-col gap-[var(--space-3)] border-[var(--brand-200)] sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex min-w-0 items-start gap-[var(--space-3)]">
            <ListChecks
              size={20}
              strokeWidth={1.8}
              className="mt-[2px] shrink-0 text-[var(--brand-600)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="paso-recursos-titulo"
                className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
              >
                Paso 2 de 2: recursos y módulos destino
              </h2>
              <p
                role="status"
                className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
              >
                {resourcesReady
                  ? 'El contenido tiene recursos y módulos destino activos. Ya puedes continuar.'
                  : 'El contenido está pendiente: guarda al menos un recurso y asigna un módulo destino activo a cada bloque.'}
              </p>
            </div>
          </div>

          <Button
            disabled={!resourcesReady || !canManage || isSubmitting}
            onClick={handleBack}
            className="shrink-0"
          >
            {fromAssociation
              ? 'Continuar y asociar a la unidad'
              : 'Finalizar contenido'}
          </Button>
        </section>
      )}

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando contenido y recursos...
          </p>
          {['h-[96px]', 'h-[280px]'].map((heightClass) => (
            <div
              key={heightClass}
              className={`${heightClass} animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : !content ? (
        <PanelNotice
          tone="neutral"
          icon={SearchX}
          title="Contenido no disponible"
          role="status"
          action={
            <Button variant="secondary" onClick={handleBack}>
              {fromAssociation ? 'Volver a la unidad' : 'Volver a contenidos'}
            </Button>
          }
        >
          No se recibió la información del contenido seleccionado.
          {contentId ? ` Identificador: ${contentId}.` : ''}
        </PanelNotice>
      ) : (
        <>
          <section
            aria-labelledby="contenido-seleccionado-titulo"
            className={`${CARD_CLASS} flex flex-col gap-[var(--space-3)]`}
          >
            <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
              Contenido seleccionado
            </p>

            <h2
              id="contenido-seleccionado-titulo"
              className="m-0 text-[length:var(--font-size-xl)] leading-[var(--line-height-snug)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]"
            >
              {content.name}
            </h2>

            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              {contentTypeLabel && (
                <StatusChip tone="brand">{contentTypeLabel}</StatusChip>
              )}

              {resourcesReady ? (
                <StatusChip tone="success" icon={CircleCheck}>
                  Listo para programar
                </StatusChip>
              ) : (
                <StatusChip tone="warning" icon={CircleAlert}>
                  Pendiente de recursos
                </StatusChip>
              )}

              {!canManage && (
                <StatusChip tone="neutral" icon={Eye}>
                  Solo consulta
                </StatusChip>
              )}
            </div>

            {!canManage && (
              <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
                Los recursos de este contenido están disponibles únicamente
                para consulta.
              </p>
            )}
          </section>

          {submitError && (
            <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
              {submitError}
            </PanelNotice>
          )}

          <div
            className={
              canManage
                ? 'grid items-start gap-[var(--space-6)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'
                : 'flex flex-col gap-[var(--space-6)]'
            }
          >
            {canManage && (
              <section
                ref={editorSectionRef}
                aria-labelledby="editor-recurso-titulo"
                className="flex min-w-0 scroll-mt-[160px] flex-col gap-[var(--space-4)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
                  <div className="min-w-0">
                    <h2
                      id="editor-recurso-titulo"
                      className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
                    >
                      {editingResource ? 'Editar recurso' : 'Agregar recurso'}
                    </h2>

                    <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                      {editingResource
                        ? `Modificando el bloque ${editingResource.order}.`
                        : 'Agrega un nuevo bloque al contenido.'}
                    </p>
                  </div>

                  {editingResource && (
                    <Button variant="secondary" onClick={resetEditor}>
                      <X size={17} strokeWidth={1.8} aria-hidden="true" />
                      Cancelar edición
                    </Button>
                  )}
                </div>

                <PsychoeducationalResourceForm
                  key={formSession}
                  form={form}
                  errors={errors}
                  destinationModules={destinationModules}
                  loading={loading || isSubmitting}
                  editing={Boolean(editingResource)}
                  submitLabel={
                    editingResource ? 'Guardar cambios' : 'Agregar recurso'
                  }
                  onChange={handleChange}
                  onFileChange={handleFileChange}
                  onModuleToggle={handleModuleToggle}
                  onSubmit={handleSubmit}
                  onCancel={resetEditor}
                />
              </section>
            )}

            <section
              aria-labelledby="bloques-contenido-titulo"
              aria-busy={isSubmitting}
              className="flex min-w-0 flex-col gap-[var(--space-4)]"
            >
              <div className="flex items-start justify-between gap-[var(--space-3)]">
                <div className="min-w-0">
                  <h2
                    id="bloques-contenido-titulo"
                    className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
                  >
                    Bloques del contenido
                  </h2>

                  <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                    Los recursos se presentan según su orden de bloque.
                  </p>
                </div>

                <span className="shrink-0 rounded-[var(--radius-full)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)] tabular-nums">
                  {resources.length}
                  <span className="sr-only"> recursos</span>
                </span>
              </div>

              <PsychoeducationalResourceList
                resources={resources}
                destinationModules={destinationModules}
                canManage={canManage}
                canReorder={canManage && !isSubmitting}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onDelete={handleRequestDelete}
              />
            </section>
          </div>
        </>
      )}

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
