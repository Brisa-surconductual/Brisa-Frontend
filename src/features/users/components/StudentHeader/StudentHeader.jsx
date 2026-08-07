import { LogOut } from 'lucide-react';

import styles from './StudentHeader.module.css';

export function StudentHeader({
  displayName,
  roleLabel,
  onLogout,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span
            className={styles.mark}
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 22 C7 21, 9 18, 11 19 C13 20, 14 15, 17 13 C19.5 11.3, 21 11.5, 23 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="23"
                cy="10"
                r="2.2"
                fill="currentColor"
              />
            </svg>
          </span>

          <span className={styles.identity}>
            <strong className={styles.name}>
              Brisa
            </strong>

            <span className={styles.greeting}>
              Hola, {displayName}
              {roleLabel && ` · ${roleLabel}`}
            </span>
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

          <span className={styles.logoutLabel}>
            Salir
          </span>
        </button>
      </div>
    </header>
  );
}