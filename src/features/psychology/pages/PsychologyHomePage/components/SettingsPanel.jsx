import { Button } from '@/shared/components/ui/Button/index.js';

import styles from './SettingsPanel.module.css';

export function SettingsPanel({ email, roleLabel, onLogout }) {
  return (
    <>
      <ul className={styles.list}>
        <li className={styles.row}>
          <span className={styles.rowLabel}>Rol</span>

          <span className={styles.rowValue}>{roleLabel}</span>
        </li>

        <li className={styles.row}>
          <span className={styles.rowLabel}>Correo</span>

          <span className={styles.rowEmail}>{email}</span>
        </li>
      </ul>

      <p className={styles.note}>
        Los ajustes del programa y la gestión de reportes llegan en M04 y M08.
      </p>

      <Button variant="secondary" fullWidth onClick={onLogout}>
        Cerrar sesión
      </Button>
    </>
  );
}
