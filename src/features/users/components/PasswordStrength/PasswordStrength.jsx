import { Check, Circle } from 'lucide-react';

import { evaluatePassword } from '../../services/registrationValidation.js';

const LEVEL_LABELS = {
  empty: '',
  weak: 'Débil',
  fair: 'Aceptable',
  strong: 'Fuerte',
};

const LEVEL_CLASS = Object.freeze({
  empty: '',
  weak: 'text-[var(--danger-text)]',
  fair: 'text-[var(--warning-text)]',
  strong: 'text-[var(--success-text)]',
});

const BAR_CLASS = Object.freeze({
  empty: 'bg-[var(--surface-border)]',
  weak: 'bg-[var(--danger)]',
  fair: 'bg-[var(--warning)]',
  strong: 'bg-[var(--success)]',
});

export function PasswordStrength({ password }) {
  const evaluation = evaluatePassword(password);

  const activeBars = {
    empty: 0,
    weak: 1,
    fair: 2,
    strong: 3,
  }[evaluation.level];

  return (
    <div className="mt-[var(--space-2)]" aria-live="polite" aria-label="Seguridad de la contraseña">
      <div className="flex gap-[var(--space-1)]" aria-hidden="true">
        {[1, 2, 3].map((bar) => {
          const isActive = bar <= activeBars;

          return (
            <span
              key={bar}
              className={`h-[4px] flex-1 rounded-[var(--radius-full)] ${
                isActive
                  ? BAR_CLASS[evaluation.level]
                  : 'bg-[var(--surface-border)]'
              }`}
            />
          );
        })}
      </div>

      {password && (
        <p className={`mt-[5px] mb-0 text-[11px] font-bold ${LEVEL_CLASS[evaluation.level]}`}>
          Seguridad: {LEVEL_LABELS[evaluation.level]}
        </p>
      )}

      <ul className="mt-[var(--space-3)] mb-0 flex list-none flex-col gap-[var(--space-1)] p-0">
        {evaluation.rules.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-[6px] text-[11px] ${
              rule.met
                ? 'font-semibold text-[var(--success-text)]'
                : 'text-[var(--text-muted)]'
            }`}
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