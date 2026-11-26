import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';

import { CreateGroupFlowForm } from './components/CreateGroupFlowForm/index.js';
import { GroupFlowList } from './components/GroupFlowList/index.js';
import { useGroupTreesPage } from './hooks/useGroupTreesPage.js';

/*
 * RF-25 · Gestión del árbol conversacional grupal. Esta entrega cubre
 * listar flujos y crear un borrador; nodos, transiciones, validación y
 * publicación llegan en las siguientes.
 */
export function GroupTreesPage() {
  const page = useGroupTreesPage();

  return (
    <div className="bg-[var(--surface-bg)]">
      <ChatSectionTabs />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <ChatAdminHeader
          title="Árbol conversacional grupal"
          description="Consulta los flujos de la modalidad grupal y crea nuevos borradores."
        />

        <CreateGroupFlowForm
          nombre={page.nombre}
          nombreError={page.nombreError}
          creation={page.creation}
          onChangeNombre={page.changeNombre}
          onSubmit={page.createFlow}
        />

        <GroupFlowList
          status={page.status}
          listado={page.listado}
          loadError={page.loadError}
          estado={page.estado}
          estadoOptions={page.estadoOptions}
          page={page.page}
          onChangeEstado={page.changeEstado}
          onChangePage={page.changePage}
          onRetry={page.retry}
        />
      </div>
    </div>
  );
}
