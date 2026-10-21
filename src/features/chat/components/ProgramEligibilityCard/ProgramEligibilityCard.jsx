import { CheckCircle2, CircleX, Info, TriangleAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

export function ProgramEligibilityCard({
  eligibility,
  isLoading = false,
  error = null,
  onEnable,
}) {
  if (isLoading) {
    return (
      <p role="status" className="text-[var(--text-secondary)]">
        Consultando elegibilidad del programa...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-[var(--danger-text)]">
        No fue posible consultar la elegibilidad del programa.
      </p>
    );
  }

  if (!eligibility) {
    return (
      <p role="status" className="text-[var(--text-muted)]">
        Selecciona un programa para consultar su elegibilidad.
      </p>
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

  return (
    <section
      aria-labelledby="program-modality-title"
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <div>
          <h2
            id="program-modality-title"
            className="m-0 text-lg font-extrabold text-[var(--text-primary)]"
          >
            Programa #{id_programa}
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-xs text-[var(--text-muted)]">
            Estado de la modalidad conversacional
          </p>
        </div>

        <span className="rounded-[var(--radius-full)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-3)] py-[var(--space-1)] text-xs font-bold text-[var(--info-text)]">
          {modalidad_actual ?? 'SIN DEFINIR'}
        </span>
      </div>

      <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-3)]">
        <div className="flex justify-between gap-[var(--space-3)] border-b border-[var(--surface-border)] pb-[var(--space-3)]">
          <span className="text-sm text-[var(--text-secondary)]">
            Participantes activos
          </span>
          <strong className="text-sm text-[var(--text-primary)]">
            {total}
          </strong>
        </div>

        <div className="flex justify-between gap-[var(--space-3)]">
          <span className="text-sm text-[var(--text-secondary)]">
            Perfiles clínicos completos
          </span>
          <strong className="text-sm text-[var(--text-primary)]">
            {completos} / {total}
          </strong>
        </div>

        <div
          role="progressbar"
          aria-label="Porcentaje de perfiles clínicos completos"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className="h-[10px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]"
        >
          <div
            className="h-full rounded-[var(--radius-full)] bg-[var(--brand-500)] transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="m-0 text-right text-xs font-semibold text-[var(--text-muted)]">
          {percentage}% de perfiles completos
        </p>
      </div>

      {incompletos > 0 && (
        <div
          role="status"
          className="mt-[var(--space-5)] flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)]"
        >
          <TriangleAlert
            size={20}
            className="shrink-0 text-[var(--warning-text)]"
            aria-hidden="true"
          />

          <div>
            <p className="m-0 text-sm font-bold text-[var(--warning-text)]">
              Perfiles clínicos incompletos
            </p>
            <p className="mt-[var(--space-2)] mb-0 text-sm text-[var(--warning-text)]">
              {incompletos} participantes activos todavía no tienen su perfil
              clínico completo. No es posible habilitar la modalidad
              personalizada.
            </p>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="mt-[var(--space-5)] flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)]">
          <Info
            size={20}
            className="shrink-0 text-[var(--info-text)]"
            aria-hidden="true"
          />
          <p className="m-0 text-sm text-[var(--info-text)]">
            El programa necesita al menos un participante activo para habilitar
            la transición.
          </p>
        </div>
      )}

      {!isPersonalized && (
        <div className="mt-[var(--space-6)]">
          <h3 className="mb-[var(--space-3)] text-sm font-bold text-[var(--text-primary)]">
            Validación de condiciones
          </h3>

          <ul className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
            {checks.map(({ id, label, valid }) => (
              <li
                key={id}
                className="flex items-start gap-[var(--space-3)] text-sm text-[var(--text-primary)]"
              >
                {valid ? (
                  <CheckCircle2
                    size={20}
                    className="shrink-0 text-[var(--success-text)]"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleX
                    size={20}
                    className="shrink-0 text-[var(--danger-text)]"
                    aria-hidden="true"
                  />
                )}

                <span>
                  {label}: {valid ? 'Cumple' : 'No cumple'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-[var(--space-6)]">
        <p
          role="status"
          className={`mb-[var(--space-4)] text-sm font-semibold ${
            isPersonalized || elegible
              ? 'text-[var(--success-text)]'
              : 'text-[var(--danger-text)]'
          }`}
        >
          {isPersonalized
            ? 'La modalidad personalizada ya está habilitada.'
            : elegible
              ? 'El programa cumple las condiciones para la transición.'
              : 'El programa no cumple las condiciones para la transición.'}
        </p>

        <Button fullWidth disabled={!canEnable} onClick={onEnable}>
          {isPersonalized
            ? 'Modalidad personalizada habilitada'
            : 'Habilitar modalidad personalizada'}
        </Button>

        <p className="mt-[var(--space-3)] mb-0 text-center text-xs text-[var(--text-muted)]">
          RF-25B · Transición de modalidad grupal a personalizada
        </p>
      </div>
    </section>
  );
}
