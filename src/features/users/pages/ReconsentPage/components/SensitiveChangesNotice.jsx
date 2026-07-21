import { ShieldAlert } from 'lucide-react';

import styles from './SensitiveChangesNotice.module.css';

export function SensitiveChangesNotice({
  fields,
}) {
  return (
    <div
      className={styles.warning}
      role="alert"
    >
      <ShieldAlert
        size={22}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      <div>
        <strong>
          Modificaste información sensible
        </strong>

        <p>
          Los siguientes cambios requieren una
          nueva aceptación:
        </p>

        <ul>
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