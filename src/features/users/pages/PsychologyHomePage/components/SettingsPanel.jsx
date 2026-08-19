import { Button } from '@/shared/components/ui/Button/index.js';

export function SettingsPanel({
  email,
  roleLabel,
  onLogout,
}) {
  return (
    <>
      <ul className="mx-auto mt-0 mb-[var(--space-4)] w-full max-w-[720px] list-none rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] shadow-[var(--shadow-sm)] md:px-[var(--space-5)] md:py-[var(--space-3)]">
        <li className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--surface-hover)] py-[var(--space-3)] text-[12px] last:border-b-0 md:text-[13px]">
          <span className="shrink-0 text-[var(--text-muted)]">
            Rol
          </span>

          <span className="text-right font-semibold text-[var(--text-primary)]">
            {roleLabel}
          </span>
        </li>

        <li className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--surface-hover)] py-[var(--space-3)] text-[12px] last:border-b-0 md:text-[13px]">
          <span className="shrink-0 text-[var(--text-muted)]">
            Correo
          </span>

          <span className="min-w-0 overflow-hidden text-right text-[11px] font-semibold text-ellipsis text-[var(--text-primary)] md:text-[12px]">
            {email}
          </span>
        </li>
      </ul>

      <p className="mx-auto mt-0 mb-[var(--space-4)] max-w-[720px] text-[11px] leading-[1.5] text-[var(--text-muted)] md:text-[12px]">
        Los ajustes del programa y la gestión de reportes llegan en M04 y M08.
      </p>

      <div>
        <Button
          variant="secondary"
          fullWidth
          onClick={onLogout}
        >
          Cerrar sesión
        </Button>
      </div>
    </>
  );
}