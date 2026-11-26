import { RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { useServiceWorkerUpdate } from '../useServiceWorkerUpdate.js';

const UPDATE_NOTICE_TEXT = Object.freeze({
  message: 'Hay una nueva versión de Brisa.',
  update: 'Actualizar',
  later: 'Más tarde',
});

// Aviso de actualización (C-PWA-4): no recarga hasta que la persona lo pide.
export function UpdateAvailableNotice({ store }) {
  const { needRefresh, update, dismiss } = useServiceWorkerUpdate(store);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-[var(--space-4)] bottom-[calc(var(--space-4)+env(safe-area-inset-bottom))] z-[100] mx-auto flex max-w-[420px] flex-wrap items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
    >
      <RefreshCw
        className="shrink-0 text-[var(--brand-600)]"
        size={20}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      <p className="m-0 min-w-[160px] flex-1 text-[14px] font-semibold leading-[1.4]">
        {UPDATE_NOTICE_TEXT.message}
      </p>

      <div className="ml-auto flex gap-[var(--space-2)]">
        <Button variant="ghost" size="small" onClick={dismiss}>
          {UPDATE_NOTICE_TEXT.later}
        </Button>

        <Button size="small" onClick={update}>
          {UPDATE_NOTICE_TEXT.update}
        </Button>
      </div>
    </div>
  );
}
