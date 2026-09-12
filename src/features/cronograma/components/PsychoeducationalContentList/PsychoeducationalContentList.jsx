import { PsychoeducationalContentCard } from '@/features/cronograma/components/PsychoeducationalContentCard/index.js';

export function PsychoeducationalContentList({
  contents,
  onEdit,
  onDelete,
}) {
  if (contents.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-7)] text-center">
        <h2 className="m-0 text-[17px] font-extrabold text-[var(--text-primary)]">
          No hay contenidos registrados
        </h2>

        <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[520px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
          Cuando existan contenidos psicoeducativos aparecerán en esta sección.
        </p>
      </section>
    );
  }

  return (
    <section
      className="grid gap-[var(--space-4)] md:grid-cols-2"
      aria-label="Contenidos psicoeducativos"
    >
      {contents.map((content) => (
        <PsychoeducationalContentCard
          key={content.id}
          content={content}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}