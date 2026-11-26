import { Pencil } from 'lucide-react';

export function ReviewCard({
  title,
  rows,
  onEdit = null,
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
      <header className="flex items-center justify-between gap-[var(--space-4)] border-b border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-5)] py-[var(--space-2)]">
        <h2 className="m-0 py-[var(--space-2)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]">
          {title}
        </h2>

        {onEdit && (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-0 bg-transparent px-[var(--space-3)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] transition-colors duration-150 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] motion-reduce:transition-none"
            onClick={onEdit}
          >
            <Pencil
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>Editar</span>
            <span className="sr-only"> {title}</span>
          </button>
        )}
      </header>

      <dl className="m-0 px-[var(--space-5)] py-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(120px,0.8fr)_minmax(0,1.2fr)] gap-[var(--space-4)] border-b border-[var(--surface-border)] py-[var(--space-3)] last:border-b-0 max-[460px]:grid-cols-1 max-[460px]:gap-[var(--space-1)]"
          >
            <dt className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              {row.label}
            </dt>

            <dd className="m-0 text-right text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold text-[var(--text-primary)] [overflow-wrap:anywhere] max-[460px]:text-left">
              {row.value || '—'}

              {row.modified && (
                <span className="mt-[var(--space-1)] ml-auto block w-fit rounded-[var(--radius-full)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-2)] py-[2px] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-medium text-[var(--warning-text)] max-[460px]:ml-0">
                  Modificado
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
