import { Check } from 'lucide-react';

const STEPS = [
  'Cuenta',
  'Consentimiento',
  'Línea base',
  'Revisión',
];

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
          ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--neutral-0)]'
          : isActive
            ? 'border-[var(--brand-500)] bg-[var(--surface-card)] text-[var(--brand-600)] shadow-[0_0_0_3px_rgb(29_131_120/15%)]'
            : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-muted)]';

        const labelStateClass = isActive
          ? 'font-bold text-[var(--text-primary)]'
          : 'text-[var(--text-muted)]';

        return (
          <li
            key={label}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-[6px] before:absolute before:top-[13px] before:right-1/2 before:h-[2px] before:w-full before:content-[''] first:before:hidden ${itemStateClass}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className={`z-[1] inline-flex h-[28px] w-[28px] items-center justify-center rounded-[var(--radius-full)] border-[1.5px] font-[var(--font-mono)] text-[11px] font-semibold ${circleStateClass}`}>
              {isCompleted ? (
                <Check
                  size={14}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              ) : (
                stepNumber
              )}
            </span>

            <span className={`max-w-[82px] text-center text-[10px] leading-[1.3] max-[370px]:text-[9px] ${labelStateClass}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}