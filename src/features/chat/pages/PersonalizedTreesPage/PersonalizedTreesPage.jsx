import { AlertTriangle, CheckCircle2, PlugZap } from 'lucide-react';

import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { PersonalizedTreesList } from '../../components/PersonalizedTreesList/index.js';

export function PersonalizedTreesPage({
  trees = null,
  isLoading = false,
  error = null,
  notice = '',
  actionError = '',
  renderActions,
  dialog = null,
}) {
  // Sin datos ni error: la consulta aún no llega a esta pantalla.
  const isPendingIntegration = !Array.isArray(trees) && !isLoading && !error;

  return (
    <div className="bg-[var(--surface-bg)]">
      <ChatSectionTabs />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <ChatAdminHeader
          title="Administración de árboles conversacionales"
          description="Consulta los árboles personalizados según las combinaciones de dependencia y craving."
        />

        {isPendingIntegration && (
          <ChatAdminNotice
            tone="warning"
            icon={PlugZap}
            title="Integración pendiente"
          >
            La consulta de árboles conversacionales aún no está conectada al
            backend. Esta pantalla no muestra árboles de ejemplo.
          </ChatAdminNotice>
        )}

        {notice && (
          <ChatAdminNotice tone="success" icon={CheckCircle2} role="status">
            {notice}
          </ChatAdminNotice>
        )}

        {actionError && (
          <ChatAdminNotice
            tone="danger"
            icon={AlertTriangle}
            role="alert"
            title="No se pudo completar la acción"
          >
            {actionError}
          </ChatAdminNotice>
        )}

        <PersonalizedTreesList
          trees={trees}
          isLoading={isLoading}
          error={error}
          renderActions={renderActions}
        />

        {dialog}
      </div>
    </div>
  );
}
