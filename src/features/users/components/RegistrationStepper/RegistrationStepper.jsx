import { Check } from 'lucide-react';

const STEPS = [
  'Cuenta',
  'Consentimiento',
  'Línea base',
  'Revisión',
];

/*
 * Indicador de etapas: informativo, sin navegación. El estado de
 * cada paso se dice con texto oculto además del color e ícono.
 */
export function RegistrationStepper({ currentStep }) {
  return (
    <ol className="m-0 flex w-full list-none p-0" aria-label="Progreso del registro">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        const itemStateClass = isCompleted || isActive
          ? 'before:bg-[var(--brand-500)]'
          : 'before:bg-[var(--surface-border)]';

        const circleStateClass = isCompleted
          ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--button-primary-text)]'
          : isActive
            ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[var(--focus-ring)]'
            : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-muted)]';

        const labelStateClass = isActive
          ? 'font-bold text-[var(--text-primary)]'
          : isCompleted
            ? 'font-semibold text-[var(--text-secondary)]'
            : 'text-[var(--text-muted)]';

        return (
          <li
            key={label}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-[var(--space-2)] before:absolute before:top-[15px] before:right-1/2 before:h-[2px] before:w-full before:content-[''] first:before:hidden ${itemStateClass}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className={`z-[1] inline-flex h-[32px] w-[32px] items-center justify-center rounded-[var(--radius-full)] border-[1.5px] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-bold ${circleStateClass}`}>
              {isCompleted ? (
                <Check
                  size={15}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              ) : (
                stepNumber
              )}
            </span>

            <span className={`max-w-[88px] text-center text-[length:var(--font-size-xs)] leading-[var(--line-height-snug)] max-[370px]:text-[10px] ${labelStateClass}`}>
              {label}
              {isCompleted && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
