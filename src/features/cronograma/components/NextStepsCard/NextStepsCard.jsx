import { ListChecks } from 'lucide-react';

/*
 * Guía lateral de un formulario: describe el flujo existente,
 * no añade acciones. Los pasos los define cada página.
 */
export function NextStepsCard({ id, title, steps }) {
  const titleId = `${id}-titulo`;

  return (
    <aside
      aria-labelledby={titleId}
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] sm:p-[var(--space-5)]"
    >
      <h2
        id={titleId}
        className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
      >
        <ListChecks
          size={18}
          strokeWidth={1.8}
          className="text-[var(--brand-600)]"
          aria-hidden="true"
        />
        {title}
      </h2>

      <ol className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-[var(--space-3)]">
            <span
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-50)] text-[length:var(--font-size-xs)] font-extrabold text-[var(--brand-700)] tabular-nums"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
