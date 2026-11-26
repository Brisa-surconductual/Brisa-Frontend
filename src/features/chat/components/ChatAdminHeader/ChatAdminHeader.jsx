/*
 * Encabezado de las pantallas administrativas del chat: antetítulo,
 * único h1 de la página, descripción y estado opcional. No es un
 * <header> de página: AdminLayout ya aporta el suyo.
 */
export function ChatAdminHeader({
  eyebrow = 'Administración · Chat terapéutico',
  title,
  description,
  badge,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
      <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
        {eyebrow}
      </p>

      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          {title}
        </h1>

        {badge}
      </div>

      {description && (
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          {description}
        </p>
      )}
    </div>
  );
}
