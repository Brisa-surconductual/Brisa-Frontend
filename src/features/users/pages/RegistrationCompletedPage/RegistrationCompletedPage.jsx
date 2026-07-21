import { Navigate } from 'react-router-dom';

import {
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

import {
  BrisaLogo,
} from '../../../../shared/components/brand/BrisaLogo/index.js';

import {
  useRegistration,
} from '../../hooks/useRegistration.js';

import {
  REGISTRATION_STATUS,
} from '../../types/registrationStatus.js';

import styles from './RegistrationCompletedPage.module.css';

export function RegistrationCompletedPage() {
  const { account } = useRegistration();

  const registrationIsComplete =
    account?.registrationStatus ===
    REGISTRATION_STATUS.COMPLETED;

  if (!registrationIsComplete) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  return (
    <div className={styles.page}>
      <BrisaLogo />

      <span
        className={styles.icon}
        aria-hidden="true"
      >
        <CheckCircle2
          size={44}
          strokeWidth={1.6}
        />
      </span>

      <section className={styles.content}>
        <h1>Registro completado</h1>

        <p>
          Tu cuenta y la información de línea base
          fueron confirmadas correctamente.
        </p>
      </section>

      <div className={styles.summary}>
        <ShieldCheck
          size={20}
          strokeWidth={1.6}
          aria-hidden="true"
        />

        <div>
          <span>Cuenta registrada</span>
          <strong>{account.email}</strong>
        </div>
      </div>

      <span className={styles.status}>
        Registro completo
      </span>

      <p className={styles.completionNote}>
        Tu información quedó registrada de acuerdo
        con las autorizaciones aceptadas.
      </p>
    </div>
  );
}