import { AlertTriangle } from 'lucide-react';

import { ChatAdminModal } from '../../../../components/ChatAdminModal/index.js';
import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';

const FORM_ID = 'confirmar-transiciones-afectadas';

/*
 * RF-25 · Al cambiar el tipo de respuesta de un nodo, sus transiciones de
 * salida dejan de tener sentido (su regla se derivaba de ese tipo). Este
 * diálogo las lista y pide confirmar que se eliminen al guardar el nodo.
 */
export function AffectedTransitionsDialog({
  transiciones,
  saving = false,
  onConfirm,
  onCancel,
}) {
  return (
    <ChatAdminModal
      open
      title="Se eliminarán transiciones"
      formId={FORM_ID}
      submitText="Eliminar y guardar"
      saving={saving}
      onRequestClose={onCancel}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <ChatAdminNotice tone="warning" icon={AlertTriangle} role="alert">
          Cambiaste el tipo de respuesta de este nodo. Las siguientes
          transiciones dependían del tipo anterior y ya no tienen sentido: se
          eliminarán al guardar. Después puedes crear las nuevas.
        </ChatAdminNotice>

        <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
          {transiciones.map((t) => (
            <li
              key={t.id}
              className="rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-primary)]"
            >
              <span className="font-bold">{t.origen}</span>
              {' → '}
              <span className="font-bold">{t.destino}</span>
              <span className="text-[var(--text-secondary)]">
                {' '}
                · Evaluación {t.orden}
              </span>
            </li>
          ))}
        </ul>
      </form>
    </ChatAdminModal>
  );
}
