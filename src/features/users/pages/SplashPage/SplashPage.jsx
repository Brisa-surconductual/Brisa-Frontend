import { Button } from '@/shared/components/ui/Button/index.js';

import { useSplashPage } from './hooks/useSplashPage.js';

export function SplashPage() {
  const { goToCreateAccount, goToLogin } = useSplashPage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,var(--brand-700)_0%,var(--brand-500)_60%,var(--brand-400)_100%)] p-[var(--space-5)]">
      <div className="flex w-full max-w-[360px] flex-col items-center text-center">
        <div className="mb-[var(--space-5)] flex h-[72px] w-[72px] items-center justify-center rounded-[var(--radius-2xl)] bg-[rgba(255,255,255,0.15)] backdrop-blur-[4px]" aria-hidden="true">
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

        <h1 className="mt-0 mb-[var(--space-2)] text-[30px] font-extrabold tracking-[-0.02em] text-white">
          Brisa
        </h1>

        <p className="mt-0 mb-[var(--space-8)] text-[13px] leading-[1.5] text-[rgba(255,255,255,0.7)]">
          Apoyo psicoeducativo para reducir el consumo de vapeo en estudiantes universitarios
        </p>

        <div className="flex w-full flex-col gap-[var(--space-3)]">
          <Button
            variant="secondary"
            fullWidth
            onClick={goToCreateAccount}
          >
            Crear cuenta
          </Button>

          <Button
            variant="ghost"
            fullWidth
            className="!border-[rgba(255,255,255,0.4)] !text-white"
            onClick={goToLogin}
          >
            Iniciar sesión
          </Button>
        </div>

        <p className="mt-[var(--space-4)] text-center text-[10.5px] text-[rgba(255,255,255,0.45)]">
          v1.0.0 · Universidad Surcolombiana
        </p>
      </div>
    </div>
  );
}