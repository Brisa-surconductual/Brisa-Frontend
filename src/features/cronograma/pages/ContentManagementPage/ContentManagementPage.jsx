import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { PsychoeducationalContentList } from '@/features/cronograma/components/PsychoeducationalContentList/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

const EMPTY_CONTENTS = Object.freeze([]);

export function ContentManagementPage({
  contents = EMPTY_CONTENTS,
  loading = false,
  onDeleteContent,
}) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const [
    pendingDeleteContent,
    setPendingDeleteContent,
  ] = useState(null);

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    navigate(
      `/app/administrativo?tab=${encodeURIComponent(tabId)}`,
    );
  }

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreate() {
    navigate(
      '/app/administrativo/cronograma/contenidos/nuevo',
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

  function handleConfirmDelete() {
    if (!pendingDeleteContent) {
      return;
    }

    onDeleteContent?.(pendingDeleteContent);

    setPendingDeleteContent(null);
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="w-fit text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al cronograma
          </button>

          <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
            <div>
              <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
                Administración
              </p>

              <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
                Contenidos psicoeducativos
              </h1>

              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Consulta y administra los contenidos disponibles para el cronograma.
              </p>
            </div>

            <Button onClick={handleCreate}>
              Crear contenido
            </Button>
          </header>

          {loading ? (
            <p
              className="m-0 py-[var(--space-7)] text-center text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando contenidos...
            </p>
          ) : (
            <PsychoeducationalContentList
              contents={contents}
              onEdit={handleEdit}
              onDelete={handleRequestDelete}
            />
          )}
        </div>
      </main>

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