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

export function RegistrationStatusNotice({
  view,
  estadoRegistro,
  onGoToConsent,
}) {
  const { tone, Icon, title, description, label } =
    NOTICE_BY_VIEW[view] ?? NOTICE_BY_VIEW[REGISTRATION_STATUS_VIEW.UNKNOWN];
  const toneClass = TONE_CLASS[tone];
  // Etiqueta propia en los estados que no deben mostrarse tal cual.
  const statusLabel = label ?? estadoRegistro;

  return (
    <>
      <div className={`flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)] md:p-[var(--space-4)] ${toneClass.box}`}>
        <Icon size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

        <div>
          <strong className="block text-[13px] md:text-[14px]">
            {title}
          </strong>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] opacity-90 md:text-[13px]">
            {description}
          </p>

          {view === REGISTRATION_STATUS_VIEW.PENDING_CONSENT && (
            <Button
              variant="secondary"
              size="small"
              className="mt-[var(--space-3)]"
              onClick={onGoToConsent}
            >
              Revisar consentimiento
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <span className="text-[13px] font-bold text-[var(--text-primary)] md:text-[14px]">
          Estado de tu cuenta
        </span>

        <span className={`inline-flex items-center gap-[var(--space-1)] whitespace-nowrap rounded-[var(--radius-full)] border px-[var(--space-2)] py-[3px] font-[var(--font-mono)] text-[10px] font-bold ${toneClass.box}`}>
          <span className={`h-[6px] w-[6px] shrink-0 rounded-[var(--radius-full)] ${toneClass.dot}`} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
    </>
  );
}
