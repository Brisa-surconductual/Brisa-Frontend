import { ArrowLeft } from 'lucide-react';

import { BrisaLogo } from '@/shared/components/brand/BrisaLogo/index.js';

import { RegistrationStepper } from '../RegistrationStepper/index.js';

/*
 * Cabecera común del registro y del acceso: regreso (si la página
 * lo ofrece), marca, indicador de etapas, antetítulo, único h1 y
 * descripción. Solo presentación: cada página conserva su lógica.
 */
export function RegistrationHeader({
  onBack,
  backLabel = 'Volver',
  sectionLabel,
  step,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex min-h-[44px] items-center justify-between gap-[var(--space-3)]">
        {onBack ? (
          <div className="flex min-w-0 items-center gap-[var(--space-3)]">
            <button
              type="button"
              className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-0 text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
              onClick={onBack}
              aria-label={backLabel}
            >
              <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" />
            </button>

            {sectionLabel && (
              <span className="truncate text-[length:var(--font-size-sm)] font-bold text-[var(--text-secondary)]">
                {sectionLabel}
              </span>
            )}
          </div>
        ) : (
          <span />
        )}

        <BrisaLogo />
      </div>

      {step && <RegistrationStepper currentStep={step} />}

      <div className="flex flex-col gap-[var(--space-2)]">
        {(eyebrow || step) && (
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
            {eyebrow ?? `Paso ${step} de 4`}
          </p>
        )}

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          {title}
        </h1>

        {description && (
          <p className="m-0 text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
