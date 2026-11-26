import { Archive, CopyPlus, Plus, Send } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import {
  ACCION_ARBOL,
  accionesDisponibles,
} from '../../../../services/arbolesPersonalizados.js';

const ACCION_VISTA = Object.freeze({
  [ACCION_ARBOL.CREAR]: {
    label: 'Crear borrador',
    Icon: Plus,
    variant: 'primary',
  },
  [ACCION_ARBOL.NUEVA_VERSION]: {
    label: 'Nueva versión',
    Icon: CopyPlus,
    variant: 'secondary',
  },
  [ACCION_ARBOL.PUBLICAR]: {
    label: 'Publicar',
    Icon: Send,
    variant: 'primary',
  },
  [ACCION_ARBOL.ARCHIVAR]: {
    label: 'Archivar',
    Icon: Archive,
    variant: 'secondary',
  },
});

/*
 * Acciones sobre la última versión de una combinación (RF-25C). No hay
 * botón de eliminar: los árboles se archivan, no se borran.
 */
export function PersonalizedTreeActions({ tree, combination, busy, onAction }) {
  const acciones = accionesDisponibles(tree);

  if (acciones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-[var(--space-2)]">
      {acciones.map((accion) => {
        const { label, Icon, variant } = ACCION_VISTA[accion];

        return (
          <Button
            key={accion}
            variant={variant}
            size="small"
            disabled={busy}
            aria-label={`${label}: ${combination.label}`}
            onClick={() => onAction(accion, { tree, combination })}
          >
            <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
