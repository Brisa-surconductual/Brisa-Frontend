export function BaselineSection({
  id,
  icon,
  title,
  description,
  children,
}) {
  return (
    <fieldset
      id={id}
      className="m-0 flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] max-[370px]:p-[var(--space-4)]"
    >
      <legend className="m-0 flex w-auto items-center gap-[var(--space-3)] px-[var(--space-2)] py-0">
        <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]" aria-hidden="true">
          {icon}
        </span>

        <span className="flex flex-col">
          <strong className="text-[15px] font-extrabold text-[var(--text-primary)]">
            {title}
          </strong>

          <small className="mt-[2px] text-[11px] font-medium text-[var(--text-muted)]">
            {description}
          </small>
        </span>
      </legend>

      {children}
    </fieldset>
  );
}