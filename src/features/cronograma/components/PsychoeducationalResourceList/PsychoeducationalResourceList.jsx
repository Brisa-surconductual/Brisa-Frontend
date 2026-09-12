import { PsychoeducationalResourceCard } from '@/features/cronograma/components/PsychoeducationalResourceCard/index.js';

export function PsychoeducationalResourceList({
  resources,
  canManage = false,
  onEdit,
  onDelete,
}) {
  if (resources.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-7)] text-center">
        <h2 className="m-0 text-[17px] font-extrabold text-[var(--text-primary)]">
          No hay recursos registrados
        </h2>

        <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[520px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
          Los bloques de texto y recursos multimedia
          asociados a este contenido aparecerán aquí.
        </p>
      </section>
    );
  }

  const orderedResources = [...resources].sort(
    (firstResource, secondResource) =>
      firstResource.order - secondResource.order,
  );

  return (
    <section
      className="grid gap-[var(--space-4)]"
      aria-label="Recursos del contenido psicoeducativo"
    >
      {orderedResources.map((resource) => (
        <PsychoeducationalResourceCard
          key={resource.id}
          resource={resource}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}