import { Navigate } from 'react-router-dom';

import {
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

import { BrisaLogo } from '../../../../shared/components/brand/BrisaLogo/index.js';

import { useRegistration } from '../../hooks/useRegistration.js';

import styles from './RegistrationCompletedPage.module.css';

export function RegistrationCompletedPage() {
  const { account } = useRegistration();

  if (
    !account ||
    account.registrationStatus !==
      'REGISTRO_COMPLETO'
  ) {
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

      <span className={styles.icon} aria-hidden="true">
        <CheckCircle2
          size={44}
          strokeWidth={1.6}
        />
      </span>

      <section className={styles.content}>
        <h1>Registro completado</h1>

        <p>
          Tu cuenta y la información de línea base fueron
          confirmadas correctamente.
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
        REGISTRO_COMPLETO
      </span>

      <p className={styles.integrationNote}>
        Esta pantalla será conectada posteriormente con el
        inicio del participante.
      </p>
    </div>
  );
}