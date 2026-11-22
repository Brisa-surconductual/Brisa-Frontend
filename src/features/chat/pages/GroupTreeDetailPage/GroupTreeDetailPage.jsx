import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatAdminModal } from '../../components/ChatAdminModal/index.js';
import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { FlowStatusBadge } from '../../components/FlowStatusBadge/index.js';
import { ACCION_FLUJO } from '../../services/flujosAdmin.js';
import {
  opcionesNodoDestino,
  opcionesNodoOrigen,
  totalTransicionesEspecificas,
} from '../../services/transicionesAdmin.js';

import { AffectedTransitionsDialog } from './components/AffectedTransitionsDialog/index.js';
import { FlowStatusActions } from './components/FlowStatusActions/index.js';
import { FlowTreeDiagram } from './components/FlowTreeDiagram/index.js';
import { NodeEditorForm } from './components/NodeEditorForm/index.js';
import { TransitionEditorForm } from './components/TransitionEditorForm/index.js';
import { TreeNodeList } from './components/TreeNodeList/index.js';
import { TreeTransitionList } from './components/TreeTransitionList/index.js';
import { useGroupTreeDetailPage } from './hooks/useGroupTreeDetailPage.js';

const LIST_PATH = '/app/administrativo/chat/grupal';

const TEXTO_CONFIRMACION_ESTADO = Object.freeze({
  [ACCION_FLUJO.PUBLICAR]: {
    title: '¿Publicar este flujo?',
    description:
      'Quedará como el flujo grupal vigente para los estudiantes. Revisa que esté completo antes de publicar.',
    confirmText: 'Publicar',
  },
  [ACCION_FLUJO.ARCHIVAR]: {
    title: '¿Archivar este flujo?',
    description:
      'Los flujos no se eliminan: al archivarlo deja de estar disponible y no puede volver a borrador ni a publicado.',
    confirmText: 'Archivar',
  },
});

/*
 * RF-25 · Árbol de un flujo grupal: nodos y transiciones. El "Flujo del
 * árbol" (FlowTreeDiagram) dibuja cada nodo como una hoja y cada transición
 * como una rama, desde el nodo inicial hasta el nodo final. Nodos y transiciones se pueden crear y
 * editar mientras el flujo sea un borrador. Publicar y archivar cambian el
 * estado del flujo (el backend valida la estructura al publicar); no hay
 * "desarchivar" ni "despublicar". Crear o editar un nodo o una transición
 * abre un modal; cancelar con cambios pide confirmación.
 */
export function GroupTreeDetailPage() {
  const page = useGroupTreeDetailPage();
  const { status, arbol, error, retry, editor, transitionEditor, canEdit } =
    page;
  const flujo = arbol?.flujo;
  const confirmacionEstado = page.confirmEstado
    ? TEXTO_CONFIRMACION_ESTADO[page.confirmEstado]
    : null;

  return (
    <div className="bg-[var(--surface-bg)]">
      <ChatSectionTabs />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <Link
          to={LIST_PATH}
          className="inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)] no-underline hover:underline"
        >
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Volver a los flujos
        </Link>

        <ChatAdminHeader
          title={flujo ? flujo.nombre : 'Árbol conversacional'}
          description={flujo ? `Versión ${flujo.version}` : undefined}
          badge={flujo && <FlowStatusBadge estado={flujo.estado} />}
        />

        {status === 'loading' && (
          <p
            role="status"
            aria-busy="true"
            className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
          >
            Consultando el árbol...
          </p>
        )}

        {status === 'error' && (
          <>
            <ChatAdminNotice
              tone="danger"
              icon={AlertTriangle}
              role="alert"
              title="No se pudo consultar el árbol"
            >
              {error}
            </ChatAdminNotice>

            <div>
              <Button variant="secondary" onClick={retry}>
                <RefreshCw size={18} strokeWidth={1.8} aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          </>
        )}

        {page.notice && (
          <ChatAdminNotice tone="success" icon={CheckCircle2} role="status">
            {page.notice}
          </ChatAdminNotice>
        )}

        {page.errorEstado && (
          <div role="alert">
            <ChatAdminNotice
              tone="danger"
              icon={AlertTriangle}
              title="No se pudo cambiar el estado del flujo"
            >
              {page.errorEstado}
            </ChatAdminNotice>

            {page.errorEstadoCondiciones.length > 0 && (
              <ul className="m-0 mt-[var(--space-2)] list-disc rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-[var(--space-5)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--danger-text)]">
                {page.errorEstadoCondiciones.map((condicion) => (
                  <li key={condicion}>{condicion}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {status === 'ready' && (
          <FlowStatusActions
            acciones={page.accionesEstado}
            busy={page.cambiandoEstado}
            onAction={page.solicitarCambioEstado}
          />
        )}

        {status === 'ready' && (
          <FlowTreeDiagram
            nodos={arbol.nodos}
            transiciones={arbol.transiciones}
            onSelectNodo={page.selectNodoEnArbol}
          />
        )}

        {status === 'ready' && canEdit && (
          <div>
            <Button onClick={page.openCreate}>
              <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
              Agregar nodo
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <TreeNodeList
            nodos={arbol.nodos}
            transiciones={arbol.transiciones}
            canEdit={canEdit}
            onEdit={page.openEdit}
            contenidos={page.contenidos}
          />
        )}

        {status === 'ready' && canEdit && (
          <div>
            <Button onClick={page.openCreateTransition}>
              <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
              Agregar transición
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <TreeTransitionList
            transiciones={arbol.transiciones}
            canEdit={canEdit}
            onEdit={page.openEditTransition}
          />
        )}
      </div>

      {status === 'ready' && canEdit && editor.mode !== 'closed' && (
        <ChatAdminModal
          open
          title={editor.mode === 'edit' ? 'Editar nodo' : 'Nuevo nodo'}
          formId="editor-nodo"
          submitText={editor.mode === 'edit' ? 'Guardar cambios' : 'Crear nodo'}
          saving={editor.saving}
          onRequestClose={page.closeEditor}
        >
          <NodeEditorForm
            formId="editor-nodo"
            values={editor.values}
            errors={editor.errors}
            saving={editor.saving}
            saveError={editor.saveError}
            tiposNodo={page.tiposNodo}
            contenidos={page.contenidos}
            onChange={page.changeField}
            onSubmit={page.submitEditor}
          />
        </ChatAdminModal>
      )}

      {status === 'ready' && canEdit && transitionEditor.mode !== 'closed' && (
        <ChatAdminModal
          open
          title={
            transitionEditor.mode === 'edit'
              ? 'Editar transición'
              : 'Nueva transición'
          }
          formId="editor-transicion"
          submitText={
            transitionEditor.mode === 'edit'
              ? 'Guardar cambios'
              : 'Crear transición'
          }
          saving={transitionEditor.saving}
          onRequestClose={page.closeTransitionEditor}
        >
          <TransitionEditorForm
            formId="editor-transicion"
            mode={transitionEditor.mode}
            values={transitionEditor.values}
            errors={transitionEditor.errors}
            saving={transitionEditor.saving}
            saveError={transitionEditor.saveError}
            nodosOrigen={opcionesNodoOrigen(arbol.nodos)}
            nodosDestino={opcionesNodoDestino(
              arbol.nodos,
              transitionEditor.values.idNodoOrigen,
            )}
            totalTransicionesOrigen={totalTransicionesEspecificas(
              arbol.transiciones,
              transitionEditor.values.idNodoOrigen,
            )}
            config={page.configTransicion}
            onChange={page.changeTransitionField}
            onSubmit={page.submitTransitionEditor}
          />
        </ChatAdminModal>
      )}

      {page.confirmAfectadas && (
        <AffectedTransitionsDialog
          transiciones={page.confirmAfectadas}
          saving={editor.saving}
          onConfirm={page.confirmarAfectadas}
          onCancel={page.cancelarAfectadas}
        />
      )}

      <ConfirmationDialog
        open={Boolean(page.confirmDescarte)}
        title="¿Descartar los cambios?"
        description="Lo que escribiste en este formulario se perderá."
        confirmText="Descartar"
        cancelText="Seguir editando"
        onConfirm={page.confirmarDescarte}
        onCancel={page.cancelarDescarte}
      />

      <ConfirmationDialog
        open={Boolean(page.confirmEstado)}
        title={confirmacionEstado?.title ?? ''}
        description={confirmacionEstado?.description ?? ''}
        confirmText={confirmacionEstado?.confirmText}
        loading={page.cambiandoEstado}
        onConfirm={page.confirmarCambioEstado}
        onCancel={page.cancelarCambioEstado}
      />
    </div>
  );
}
