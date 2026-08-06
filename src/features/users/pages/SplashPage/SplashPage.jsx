import { Button } from '@/shared/components/ui/Button/index.js';

import { useSplashPage } from './hooks/useSplashPage.js';

import styles from './SplashPage.module.css';

export function SplashPage() {
  const { goToCreateAccount, goToLogin } = useSplashPage();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.iconPlaque} aria-hidden="true">
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <path
              d="M4 22 C7 21, 9 18, 11 19 C13 20, 14 15, 17 13 C19.5 11.3,21 11.5,23 10"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            <circle cx="23" cy="10" r="2.4" fill="white" />

            <path
              d="M7 25 C7 23.5,8.5 22.5,10 22.5"
              stroke="rgba(255,255,255,.5)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <h1 className={styles.title}>Brisa</h1>

        <p className={styles.subtitle}>
          Apoyo psicoeducativo para reducir el consumo de vapeo en estudiantes
          universitarios
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" fullWidth onClick={goToCreateAccount}>
            Crear cuenta
          </Button>

          <Button
            variant="ghost"
            fullWidth
            className={styles.loginButton}
            onClick={goToLogin}
          >
            Iniciar sesión
          </Button>
        </div>

        <p className={styles.version}>v1.0.0 · Universidad Surcolombiana</p>
      </div>
    </div>
  );
}
