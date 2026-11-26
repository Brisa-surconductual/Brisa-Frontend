import { CircleCheck, Clock, Info, TriangleAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { REGISTRATION_STATUS_VIEW } from '@/features/users/services/registrationState.js';

/*
 * Presentación del estado de registro real de la sesión. Solo
 * REGISTRO_COMPLETO se muestra como completado.
 */
const TONE_CLASS = Object.freeze({
  success: Object.freeze({
    box: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
    dot: 'bg-[var(--success)]',
  }),
  warning: Object.freeze({
    box: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
    dot: 'bg-[var(--warning)]',
  }),
  info: Object.freeze({
    box: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
    dot: 'bg-[var(--info)]',
  }),
});

const NOTICE_BY_VIEW = Object.freeze({
  [REGISTRATION_STATUS_VIEW.COMPLETED]: Object.freeze({
    tone: 'success',
    Icon: CircleCheck,
    title: '¡Registro completado!',
    description:
      'Tu programa psicoeducativo está listo. Los módulos se habilitarán según tu progreso.',
  }),
  /*
   * REGISTRO_COMPLETO con sesión no COMPLETA: puede ser un
   * consentimiento recién aceptado o un estado que el login
   * ajustó. No se afirma acceso completo ni consentimiento
   * pendiente; un nuevo inicio de sesión obtiene el alcance real.
   */
  [REGISTRATION_STATUS_VIEW.LIMITED_SESSION]: Object.freeze({
    tone: 'info',
    Icon: Info,
    title: 'Tu sesión necesita actualizarse',
    description:
      'Es posible que algunas funciones no estén disponibles con esta sesión. Cierra sesión y vuelve a ingresar para verificar tu acceso.',
    label: 'SESIÓN LIMITADA',
  }),
  [REGISTRATION_STATUS_VIEW.PENDING_CONSENT]: Object.freeze({
    tone: 'warning',
    Icon: TriangleAlert,
    title: 'Falta aceptar el consentimiento informado',
    description:
      'Para completar tu registro debes revisar y aceptar el consentimiento informado vigente.',
  }),
  /*
   * El backend no ofrece cómo recuperar el borrador del registro:
   * no se afirma que la revisión pueda completarse desde aquí.
   */
  [REGISTRATION_STATUS_VIEW.PENDING_REVIEW]: Object.freeze({
    tone: 'warning',
    Icon: Clock,
    title: 'Tu registro está pendiente de revisión',
    description:
      'Tu registro aún no está completo. Por ahora la revisión no puede finalizarse desde la aplicación.',
  }),
  [REGISTRATION_STATUS_VIEW.UNKNOWN]: Object.freeze({
    tone: 'info',
    Icon: Info,
    title: 'No pudimos confirmar el estado de tu registro',
    description:
      'Vuelve a iniciar sesión más tarde para consultar el estado actualizado.',
    label: 'SIN CONFIRMAR',
  }),
});

function StatusChip({ toneClass, statusLabel }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-[var(--space-1)] self-start rounded-[var(--radius-full)] border border-current bg-[var(--surface-card)] px-[var(--space-2)] py-[3px] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-bold whitespace-nowrap">
      <span className={`h-[6px] w-[6px] shrink-0 rounded-[var(--radius-full)] ${toneClass.dot}`} aria-hidden="true" />
      {statusLabel}
    </span>
  );
}

/*
 * `variant="compact"`: fila breve para el inicio cuando el registro
 * está completo. Mismos textos, tono y etiqueta (las reglas no
 * cambian); solo se reduce el peso visual. Los estados que piden
 * atención usan siempre la versión completa con su acción.
 */
export function RegistrationStatusNotice({
  view,
  estadoRegistro,
  onGoToConsent,
  variant = 'full',
}) {
  const { tone, Icon, title, description, label } =
    NOTICE_BY_VIEW[view] ?? NOTICE_BY_VIEW[REGISTRATION_STATUS_VIEW.UNKNOWN];
  const toneClass = TONE_CLASS[tone];
  // Etiqueta propia en los estados que no deben mostrarse tal cual.
  const statusLabel = label ?? estadoRegistro;
  const needsAction = view === REGISTRATION_STATUS_VIEW.PENDING_CONSENT;

  if (variant === 'compact' && !needsAction) {
    return (
      <div
        className={`flex flex-wrap items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] ${toneClass.box}`}
      >
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] uppercase opacity-90">
            Estado de tu cuenta
          </p>
          <strong className="block text-[length:var(--font-size-sm)] leading-[var(--line-height-snug)] font-extrabold">
            {title}
          </strong>
        </div>

        <StatusChip toneClass={toneClass} statusLabel={statusLabel} />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="estado-cuenta-titulo"
      className={`flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border p-[var(--space-4)] sm:flex-row sm:items-start sm:gap-[var(--space-4)] md:p-[var(--space-5)] ${toneClass.box}`}
    >
      <span
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--surface-card)]"
        aria-hidden="true"
      >
        <Icon size={20} strokeWidth={1.8} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <p
          id="estado-cuenta-titulo"
          className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] uppercase opacity-90"
        >
          Estado de tu cuenta
        </p>

        <strong className="block text-[length:var(--font-size-base)] leading-[var(--line-height-snug)] font-extrabold">
          {title}
        </strong>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
          {description}
        </p>

        {needsAction && (
          <div className="mt-[var(--space-2)]">
            <Button variant="secondary" onClick={onGoToConsent}>
              Revisar consentimiento
            </Button>
          </div>
        )}
      </div>

      <StatusChip toneClass={toneClass} statusLabel={statusLabel} />
    </section>
  );
}
