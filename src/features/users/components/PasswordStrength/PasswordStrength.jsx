import { Check, Circle } from 'lucide-react';

import { evaluatePassword } from '../../services/registrationValidation.js';
import styles from './PasswordStrength.module.css';

const LEVEL_LABELS = {
  empty: '',
  weak: 'Débil',
  fair: 'Aceptable',
  strong: 'Fuerte',
};

export function PasswordStrength({ password }) {
  const evaluation = evaluatePassword(password);

  const activeBars = {
    empty: 0,
    weak: 1,
    fair: 2,
    strong: 3,
  }[evaluation.level];

  return (
    <div
      className={styles.container}
      aria-live="polite"
      aria-label="Seguridad de la contraseña"
    >
      <div className={styles.meter} aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={[
              styles.bar,
              bar <= activeBars ? styles[evaluation.level] : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>

      {password && (
        <p className={`${styles.level} ${styles[evaluation.level]}`}>
          Seguridad: {LEVEL_LABELS[evaluation.level]}
        </p>
      )}

      <ul className={styles.rules}>
        {evaluation.rules.map((rule) => (
          <li
            key={rule.key}
            className={rule.met ? styles.ruleMet : styles.rule}
          >
            {rule.met ? (
              <Check size={14} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Circle size={10} strokeWidth={2} aria-hidden="true" />
            )}

            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}