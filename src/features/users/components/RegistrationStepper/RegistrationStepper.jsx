import { Check } from 'lucide-react';

import styles from './RegistrationStepper.module.css';

const STEPS = [
  'Cuenta',
  'Consentimiento',
  'Línea base',
  'Revisión',
];

export function RegistrationStepper({ currentStep }) {
  return (
    <ol
      className={styles.stepper}
      aria-label="Progreso del registro"
    >
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        const itemClass = [
          styles.item,
          isCompleted ? styles.completed : '',
          isActive ? styles.active : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li
            key={label}
            className={itemClass}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className={styles.circle}>
              {isCompleted ? (
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              ) : (
                stepNumber
              )}
            </span>

            <span className={styles.label}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}