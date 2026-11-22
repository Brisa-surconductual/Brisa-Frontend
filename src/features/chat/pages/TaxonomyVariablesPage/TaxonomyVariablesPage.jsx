import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatAdminModal } from '../../components/ChatAdminModal/index.js';
import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { GLASS_PANEL } from '../../components/TaxonomyVariablePicker/index.js';

import { CreateVariableForm } from './components/CreateVariableForm/index.js';
import { TaxonomyVariableCard } from './components/TaxonomyVariableCard/index.js';
import { useTaxonomyVariablesPage } from './hooks/useTaxonomyVariablesPage.js';

/*
 * RF-30B · Taxonomía de variables. El equipo de psicología define qué
 * variables pueden capturar los nodos (y cómo se etiqueta cada respuesta),
 * crea nuevas y las habilita o deshabilita sin tocar código.
 */
export function TaxonomyVariablesPage() {
  const page = useTaxonomyVariablesPage();
  const deshabilitar = page.confirmacion?.habilitada !== false;

  return (
    <div className="bg-[var(--surface-bg)]">
      <ChatSectionTabs />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <div className="flex flex-wrap items-end justify-between gap-[var(--space-4)]">
          <ChatAdminHeader
            title="Variables taxonómicas"
            description="Variables que pueden capturar los nodos del chat. Al responder un nodo marcado, la respuesta del estudiante se etiqueta para el módulo de seguimiento."
            badge={
              page.version && (
                <span
                  className={`${GLASS_PANEL} px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-primary)]`}
                >
                  Versión {page.version}
                </span>
              )
            }
          />
          <Button type="button" onClick={page.openCreate}>
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Nueva variable
          </Button>
        </div>

        {page.notice && (
          <ChatAdminNotice tone="success" role="status" title="Listo">
            {page.notice}
          </ChatAdminNotice>
        )}

        {page.cambioError && (
          <ChatAdminNotice
            tone="danger"
            role="alert"
            title="No se pudo cambiar el estado"
          >
            {page.cambioError}
          </ChatAdminNotice>
        )}

        {page.status === 'loading' && (
          <p
            className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
            role="status"
          >
            Cargando taxonomía…
          </p>
        )}

        {page.status === 'error' && (
          <ChatAdminNotice
            tone="danger"
            role="alert"
            title="No se pudo cargar la taxonomía"
          >
            <p className="m-0 mb-[var(--space-2)]">{page.error}</p>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={page.retry}
            >
              <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
              Reintentar
            </Button>
          </ChatAdminNotice>
        )}

        {page.status === 'ready' && (
          <ul
            aria-label="Variables de la taxonomía"
            className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 lg:grid-cols-2"
          >
            {page.variables.map((variable) => (
              <TaxonomyVariableCard
                key={variable.codigo}
                variable={variable}
                cambiando={page.cambiando}
                onToggle={page.askToggle}
              />
            ))}
          </ul>
        )}
      </div>

      {page.creacion.open && (
        <ChatAdminModal
          open
          title="Nueva variable taxonómica"
          formId="crear-variable"
          submitText="Crear variable"
          saving={page.creacion.saving}
          onRequestClose={page.closeCreate}
        >
          <CreateVariableForm
            formId="crear-variable"
            values={page.creacion.values}
            errors={page.creacion.errors}
            saving={page.creacion.saving}
            saveError={page.creacion.saveError}
            onChange={page.changeCreate}
            onSubmit={page.submitCreate}
          />
        </ChatAdminModal>
      )}

      <ConfirmationDialog
        open={Boolean(page.confirmacion)}
        title={
          deshabilitar
            ? '¿Deshabilitar esta variable?'
            : '¿Habilitar esta variable?'
        }
        description={
          deshabilitar
            ? 'Dejará de ofrecerse en el editor de nodos. Los borradores que ya la usan no podrán guardarse ni publicarse con ella.'
            : 'Volverá a ofrecerse en el editor de nodos.'
        }
        confirmText={deshabilitar ? 'Deshabilitar' : 'Habilitar'}
        loading={Boolean(page.cambiando)}
        onConfirm={page.confirmToggle}
        onCancel={page.cancelToggle}
      />
    </div>
  );
}
