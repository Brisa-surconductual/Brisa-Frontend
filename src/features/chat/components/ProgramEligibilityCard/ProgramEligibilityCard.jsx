import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  DatabaseZap,
  Info,
  TriangleAlert,
  Users,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatAdminNotice } from '../ChatAdminNotice/index.js';

export function ProgramEligibilityCard({
  eligibility,
  isLoading = false,
  error = null,
  onEnable,
}) {
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]"
      >
        <p
          role="status"
          className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
        >
          Consultando elegibilidad del programa...
        </p>

        <span
          className="block h-[20px] w-[45%] animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-hover)] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span
          className="block h-[10px] w-full animate-pulse rounded-[var(--radius-full)] bg-[var(--surface-hover)] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span
          className="block h-[44px] w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-hover)] motion-reduce:animate-none"
          aria-hidden="true"
        />
      </section>
    );
  }

  if (error) {
    return (
      <ChatAdminNotice
        tone="danger"
        icon={AlertTriangle}
        title="Elegibilidad no disponible"
        role="alert"
      >
        No fue posible consultar la elegibilidad del programa.
        {typeof error === 'string' && ` ${error}`}
      </ChatAdminNotice>
    );
  }

  /*
   * Sin datos del programa no se muestra ninguna cifra ni se
   * ofrece la habilitación: la consulta aún no está integrada.
   */
  if (!eligibility) {
    return (
      <section
        aria-labelledby="program-modality-empty-title"
        className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)]"
      >
        <span
          className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          aria-hidden="true"
        >
          <DatabaseZap size={22} strokeWidth={1.7} />
        </span>

        <h2
          id="program-modality-empty-title"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Sin información del programa
        </h2>

        <p
          role="status"
          className="m-0 max-w-[560px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
        >
          Aquí se mostrarán los participantes activos, los perfiles completos y
          las condiciones para la transición cuando haya información del
          programa disponible.
        </p>
      </section>
    );
  }

  const {
    id_programa,
    modalidad_actual,
    total_usuarios_activos: total,
    con_perfil_completo: completos,
    sin_perfil_completo: incompletos,
    elegible,
  } = eligibility;

  const isPersonalized = modalidad_actual === 'PERSONALIZADA';

  const canEnable =
    elegible === true && !isPersonalized && typeof onEnable === 'function';

  const percentage =
    total > 0
      ? Math.min(100, Math.max(0, Math.round((completos / total) * 100)))
      : 0;

  const checks = [
    {
      id: 'participants',
      label: 'El programa tiene participantes activos',
      valid: total > 0,
    },
    {
      id: 'profiles',
      label: 'Todos los participantes tienen perfil completo',
      valid: total > 0 && incompletos === 0 && completos === total,
    },
    {
      id: 'modality',
      label: 'La modalidad actual es grupal',
      valid: modalidad_actual === 'GRUPAL',
    },
  ];

  const isReady = isPersonalized || elegible;

  return (
    <section
      aria-labelledby="program-modality-title"
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)] border-b border-[var(--surface-border)] px-[var(--space-5)] py-[var(--space-4)]">
        <div className="min-w-0">
          <h2
            id="program-modality-title"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Programa #{id_programa}
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            Estado de la modalidad conversacional
          </p>
        </div>

        <span className="rounded-[var(--radius-full)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-bold text-[var(--info-text)]">
          <span className="sr-only">Modalidad actual: </span>
          {modalidad_actual ?? 'SIN DEFINIR'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-6)] p-[var(--space-5)] lg:grid-cols-2">
        <div className="flex flex-col gap-[var(--space-3)]">
          <dl className="m-0 grid grid-cols-2 gap-[var(--space-3)]">
            <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)]">
              <dt className="flex items-center gap-[var(--space-2)] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                <Users size={16} strokeWidth={1.8} aria-hidden="true" />
                Participantes activos
              </dt>
              <dd className="mt-[var(--space-2)] mb-0 text-[length:var(--font-size-2xl)] font-extrabold text-[var(--text-primary)] tabular-nums">
                {total}
              </dd>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)]">
              <dt className="flex items-center gap-[var(--space-2)] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                <CheckCircle2 size={16} strokeWidth={1.8} aria-hidden="true" />
                Perfiles clínicos completos
              </dt>
              <dd className="mt-[var(--space-2)] mb-0 text-[length:var(--font-size-2xl)] font-extrabold text-[var(--text-primary)] tabular-nums">
                {completos} / {total}
              </dd>
            </div>
          </dl>

          <div
            role="progressbar"
            aria-label="Porcentaje de perfiles clínicos completos"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="h-[10px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]"
          >
            <div
              className="h-full rounded-[var(--radius-full)] bg-[var(--brand-500)] transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="m-0 text-right text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
            {percentage}% de perfiles completos
          </p>

          {incompletos > 0 && (
            <ChatAdminNotice
              tone="warning"
              icon={TriangleAlert}
              title="Perfiles clínicos incompletos"
              role="status"
            >
              {incompletos} participantes activos todavía no tienen su perfil
              clínico completo. No es posible habilitar la modalidad
              personalizada.
            </ChatAdminNotice>
          )}

          {total === 0 && (
            <ChatAdminNotice tone="info" icon={Info}>
              El programa necesita al menos un participante activo para
              habilitar la transición.
            </ChatAdminNotice>
          )}
        </div>

        <div className="flex flex-col gap-[var(--space-4)]">
          {!isPersonalized && (
            <div>
              <h3 className="mt-0 mb-[var(--space-3)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
                Validación de condiciones
              </h3>

              <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
                {checks.map(({ id, label, valid }) => (
                  <li
                    key={id}
                    className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--surface-border)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-primary)]"
                  >
                    {valid ? (
                      <CheckCircle2
                        size={20}
                        strokeWidth={1.8}
                        className="shrink-0 text-[var(--success-text)]"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleX
                        size={20}
                        strokeWidth={1.8}
                        className="shrink-0 text-[var(--danger-text)]"
                        aria-hidden="true"
                      />
                    )}

                    <span>
                      {label}: <strong>{valid ? 'Cumple' : 'No cumple'}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ChatAdminNotice
            tone={isReady ? 'success' : 'danger'}
            icon={isReady ? CheckCircle2 : CircleX}
            role="status"
          >
            {isPersonalized
              ? 'La modalidad personalizada ya está habilitada.'
              : elegible
                ? 'El programa cumple las condiciones para la transición.'
                : 'El programa no cumple las condiciones para la transición.'}
          </ChatAdminNotice>

          <Button fullWidth disabled={!canEnable} onClick={onEnable}>
            {isPersonalized
              ? 'Modalidad personalizada habilitada'
              : 'Habilitar modalidad personalizada'}
          </Button>

          <p className="m-0 text-center font-[var(--font-mono)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            RF-25B · Transición de modalidad grupal a personalizada
          </p>
        </div>
      </div>
    </section>
  );
}
