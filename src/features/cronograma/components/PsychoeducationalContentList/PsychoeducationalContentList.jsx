import { FileStack } from 'lucide-react';

import { PsychoeducationalContentCard } from '@/features/cronograma/components/PsychoeducationalContentCard/index.js';

import { PanelNotice } from '../PanelNotice/index.js';

export function PsychoeducationalContentList({
  contents,
  onManageResources,
  onEdit,
  onDelete,
}) {
  if (contents.length === 0) {
    return (
      <PanelNotice
        tone="neutral"
        icon={FileStack}
        title="No hay contenidos registrados"
        role="status"
      >
        Cuando existan contenidos psicoeducativos aparecerán en esta sección.
      </PanelNotice>
    );
  }

  return (
    <ul
      className="m-0 grid list-none gap-[var(--space-4)] p-0 md:grid-cols-2 2xl:grid-cols-3"
      aria-label="Contenidos psicoeducativos"
    >
      {contents.map((content) => (
        <li key={content.id} className="flex">
          <div className="flex w-full flex-col [&>article]:flex-1">
            <PsychoeducationalContentCard
              content={content}
              onManageResources={onManageResources}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
