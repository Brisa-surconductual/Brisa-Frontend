import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { FlowStatusBadge } from '../../components/FlowStatusBadge/index.js';

import { NodeEditorForm } from './components/NodeEditorForm/index.js';
import { TreeNodeList } from './components/TreeNodeList/index.js';
import { TreeTransitionList } from './components/TreeTransitionList/index.js';
import { useGroupTreeDetailPage } from './hooks/useGroupTreeDetailPage.js';

const LIST_PATH = '/app/administrativo/chat/grupal';

/*
 * RF-25 · Árbol de un flujo grupal: nodos y transiciones. Los nodos se
 * pueden crear y editar mientras el flujo sea un borrador; las transiciones
 * son de solo lectura por ahora.
 */
export function GroupTreeDetailPage() {
  const page = useGroupTreeDetailPage();
  const { status, arbol, error, retry, editor, canEdit } = page;
  const flujo = arbol?.flujo;

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

        {status === 'ready' && canEdit && editor.mode === 'closed' && (
          <div>
            <Button onClick={page.openCreate}>
              <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
              Agregar nodo
            </Button>
          </div>
        )}

        {status === 'ready' && canEdit && editor.mode !== 'closed' && (
          <NodeEditorForm
            mode={editor.mode}
            values={editor.values}
            errors={editor.errors}
            saving={editor.saving}
            saveError={editor.saveError}
            tiposNodo={page.tiposNodo}
            onChange={page.changeField}
            onSubmit={page.submitEditor}
            onCancel={page.closeEditor}
          />
        )}

        {status === 'ready' && (
          <>
            <TreeNodeList
              nodos={arbol.nodos}
              canEdit={canEdit}
              onEdit={page.openEdit}
            />
            <TreeTransitionList transiciones={arbol.transiciones} />
          </>
        )}
      </div>
    </div>
  );
}
