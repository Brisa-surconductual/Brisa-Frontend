import { FileStack } from 'lucide-react';

import { PsychoeducationalResourceCard } from '@/features/cronograma/components/PsychoeducationalResourceCard/index.js';

import { PanelNotice } from '../PanelNotice/index.js';

export function PsychoeducationalResourceList({
  resources,
  destinationModules = [],
  canManage = false,
  canReorder = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}) {
  if (resources.length === 0) {
    return (
      <PanelNotice
        tone="neutral"
        icon={FileStack}
        title="No hay recursos registrados"
        role="status"
      >
        Los bloques de texto y recursos multimedia asociados a este contenido
        aparecerán aquí.
      </PanelNotice>
    );
  }

  const orderedResources = [...resources].sort(
    (firstResource, secondResource) =>
      firstResource.order - secondResource.order,
  );

  return (
    <ol
      className="m-0 grid list-none gap-[var(--space-4)] p-0"
      aria-label="Recursos del contenido psicoeducativo"
    >
      {orderedResources.map((resource, index) => (
        <li key={resource.id}>
          <PsychoeducationalResourceCard
            resource={resource}
            destinationModules={destinationModules}
            canManage={canManage}
            canMoveUp={canReorder && index > 0}
            canMoveDown={
              canReorder &&
              index < orderedResources.length - 1
            }
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ol>
  );
}