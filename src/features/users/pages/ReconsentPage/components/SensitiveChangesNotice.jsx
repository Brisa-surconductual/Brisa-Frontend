import { ShieldAlert } from 'lucide-react';

export function SensitiveChangesNotice({
  fields,
}) {
  return (
    <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)] text-[var(--warning-text)]" role="alert">
      <ShieldAlert
        size={22}
        strokeWidth={1.8}
        className="mt-px shrink-0"
        aria-hidden="true"
      />

      <div>
        <strong className="block text-[13px]">
          Modificaste información sensible
        </strong>

        <p className="mt-[4px] mb-0 text-[12px] leading-[1.55]">
          Los siguientes cambios requieren una nueva aceptación:
        </p>

        <ul className="mt-[var(--space-2)] mb-0 pl-[var(--space-5)] text-[12px] leading-[1.6]">
          {fields.map((field) => (
            <li key={field}>
              {field}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}