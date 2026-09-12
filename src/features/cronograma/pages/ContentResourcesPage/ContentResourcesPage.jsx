import { useRef, useState } from 'react';
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

const EMPTY_RESOURCES = Object.freeze([]);
const EMPTY_DESTINATION_MODULES = Object.freeze([]);

export function ContentResourcesPage({
  content: contentProp,
  resources = EMPTY_RESOURCES,
  destinationModules = EMPTY_DESTINATION_MODULES,
  loading = false,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId } = useParams();
  const { role, logout } = useAuth();
  const editorSectionRef = useRef(null);

  const navigationContent =
    location.state?.content ?? null;

  const content = contentProp ?? navigationContent;

  const canManage = content?.canEdit === true;

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

  function handleValidSubmit(payload) {
    if (editingResource) {
      onUpdateResource?.({
        id: editingResource.id,
        ...payload,
      });

      return;
    }

    onCreateResource?.({
      contentId: content?.id ?? contentId,
      ...payload,
    });
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

                  <PsychoeducationalResourceForm
                    key={formSession}
                    form={form}
                    errors={errors}
                    destinationModules={destinationModules}
                    loading={loading}
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