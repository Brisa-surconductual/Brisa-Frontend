import { Archive, Send } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ACCION_FLUJO } from '../../../../services/flujosAdmin.js';

const ACCION_VISTA = Object.freeze({
  [ACCION_FLUJO.PUBLICAR]: {
    label: 'Publicar',
    Icon: Send,
    variant: 'primary',
  },
  [ACCION_FLUJO.ARCHIVAR]: {
    label: 'Archivar',
    Icon: Archive,
    variant: 'secondary',
  },
});

/*
 * RF-25 · Cambiar el estado del flujo grupal (publicar o archivar). No hay
 * botón de "despublicar" ni "desarchivar": el ciclo de vida no vuelve atrás.
 */
export function FlowStatusActions({ acciones, busy, onAction }) {
  if (acciones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-[var(--space-2)]">
      {acciones.map((accion) => {
        const { label, Icon, variant } = ACCION_VISTA[accion];

        return (
          <Button
            key={accion}
            variant={variant}
            disabled={busy}
            onClick={() => onAction(accion)}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
