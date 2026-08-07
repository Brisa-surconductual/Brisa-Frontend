import { LogOut } from 'lucide-react';

import styles from './PsychologyHeader.module.css';

export function PsychologyHeader({
  roleLabel,
  onLogout,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <span className={styles.brandChip}>
            Brisa
          </span>

          <span className={styles.roleChip}>
            {roleLabel}
          </span>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={onLogout}
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}