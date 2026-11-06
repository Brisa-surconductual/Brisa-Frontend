import {
  Clock3,
  FileBarChart,
  LogOut,
  Mail,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Capacidades anunciadas que aún no existen. Solo se informan:
 * no hay controles porque no hay contrato que los respalde.
 */
const UNAVAILABLE_CAPABILITIES = Object.freeze([
  Object.freeze({
    id: 'AJUSTES_PROGRAMA',
    icon: SlidersHorizontal,
    label: 'Ajustes del programa',
    module: 'M04',
  }),
  Object.freeze({
    id: 'REPORTES',
    icon: FileBarChart,
    label: 'Gestión de reportes',
    module: 'M08',
  }),
]);

export function SettingsPanel({
  email,
  roleLabel,
  onLogout,
}) {
  return (
    <div className="flex w-full max-w-[720px] flex-col gap-[var(--space-6)]">
      <section
        aria-labelledby="ajustes-cuenta-titulo"
        className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center gap-[var(--space-3)] border-b border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-4)] md:px-[var(--space-5)]">
          <span
            className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-50)] text-[var(--brand-700)]"
            aria-hidden="true"
          >
            <UserRound size={22} strokeWidth={1.7} />
          </span>

          <div className="min-w-0">
            <h2
              id="ajustes-cuenta-titulo"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Información de la cuenta
            </h2>

            <p className="mt-[2px] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              Datos de la sesión iniciada.
            </p>
          </div>
        </div>

        <dl className="m-0 px-[var(--space-4)] md:px-[var(--space-5)]">
          <div className="flex flex-col gap-[var(--space-1)] border-b border-[var(--surface-border)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between sm:gap-[var(--space-4)]">
            <dt className="flex shrink-0 items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
              Correo
            </dt>

            <dd className="m-0 min-w-0 text-[length:var(--font-size-sm)] font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)] sm:text-right">
              {email || '—'}
            </dd>
          </div>

          <div className="flex flex-col gap-[var(--space-1)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between sm:gap-[var(--space-4)]">
            <dt className="flex shrink-0 items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
              Rol
            </dt>

            <dd className="m-0">
              <span className="inline-flex rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)]">
                {roleLabel}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="ajustes-pendientes-titulo"
        className="flex flex-col gap-[var(--space-3)]"
      >
        <h2
          id="ajustes-pendientes-titulo"
          className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
        >
          Aún no disponible
        </h2>

        <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
          {UNAVAILABLE_CAPABILITIES.map(({ id, icon: Icon, label, module }) => (
            <li
              key={id}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--text-secondary)]"
                aria-hidden="true"
              />

              <span className="min-w-0 flex-1 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-primary)]">
                {label}
              </span>

              <span className="inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                <Clock3 size={12} strokeWidth={2} aria-hidden="true" />
                Llega en {module}
              </span>
            </li>
          ))}
        </ul>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Los ajustes del programa y la gestión de reportes llegan en M04 y M08.
        </p>
      </section>

      <section
        aria-labelledby="ajustes-sesion-titulo"
        className="flex flex-col gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-5)]"
      >
        <h2
          id="ajustes-sesion-titulo"
          className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
        >
          Sesión
        </h2>

        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Cierra la sesión en este dispositivo y en el servidor.
        </p>

        <div className="sm:max-w-[280px]">
          <Button
            variant="secondary"
            fullWidth
            onClick={onLogout}
          >
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </section>
    </div>
  );
}
