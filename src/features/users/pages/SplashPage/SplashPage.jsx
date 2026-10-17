import { Link } from 'react-router-dom';
import { Clock, Lock, TrendingUp } from 'lucide-react';

import { InstallAppButton } from '../../components/InstallAppButton/index.js';
import { InstallSheet } from '../../components/InstallSheet/index.js';
import { useSplashPage } from './hooks/useSplashPage.js';

import './SplashPage.css';

const WAVE_PATHS = Object.freeze([
  'M0 60 C100 20 200 20 300 60 S500 100 600 60 S800 20 900 60 S1100 100 1200 60',
  'M0 60 C100 30 200 30 300 60 S500 90 600 60 S800 30 900 60 S1100 90 1200 60',
  'M0 60 C100 10 200 10 300 60 S500 110 600 60 S800 10 900 60 S1100 110 1200 60',
]);

const POINTS = Object.freeze([
  { Icon: Clock, text: 'Actividades breves y guiadas' },
  { Icon: TrendingUp, text: 'Tu progreso, siempre a la vista' },
  { Icon: Lock, text: 'Confidencial y voluntario' },
]);

export function SplashPage() {
  const { install, isInstallOpen, openInstall, closeInstall, footer } =
    useSplashPage();

  return (
    <div className="splash-page">
      <div
        inert={isInstallOpen}
        className="splash-bg relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-[var(--space-7)] pt-[var(--space-9)] pb-[var(--space-7)] text-[var(--neutral-0)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {WAVE_PATHS.map((path, index) => (
            <div key={path} className={`splash-wave splash-wave--${index + 1}`}>
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="block h-full w-full"
              >
                <path d={path} />
              </svg>
            </div>
          ))}
        </div>

        <div className="flex w-full max-w-[390px] flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="mb-[var(--space-4)] flex h-[64px] w-[64px] items-center justify-center rounded-[var(--radius-xl)] bg-[var(--neutral-0)]/15 backdrop-blur-[4px]"
          >
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
              <path
                d="M4 22 C7 21, 9 18, 11 19 C13 20, 14 15, 17 13 C19.5 11.3,21 11.5,23 10"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              <circle cx="23" cy="10" r="2.4" fill="currentColor" />

              <path
                d="M7 25 C7 23.5,8.5 22.5,10 22.5"
                stroke="currentColor"
                strokeOpacity="0.5"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="mt-0 mb-[var(--space-2)] text-[30px] font-extrabold tracking-[-0.02em]">
            Brisa
          </h1>

          <p className="mt-0 mb-[var(--space-5)] max-w-[290px] text-[13.5px] leading-[1.5]">
            Un acompañamiento psicoeducativo para estudiantes universitarios, a
            tu ritmo.
          </p>

          <ul className="mt-0 mb-[var(--space-7)] flex w-full list-none flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--neutral-0)]/15 bg-[var(--splash-1)]/40 px-[var(--space-4)] py-[var(--space-3)]">
            {POINTS.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-[var(--space-3)] text-left text-[12.5px] font-semibold"
              >
                <span
                  aria-hidden="true"
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--neutral-0)]/15"
                >
                  <Icon size={16} strokeWidth={1.8} />
                </span>

                {text}
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col gap-[var(--space-3)]">
            <InstallAppButton
              modo={install.modo}
              onOpen={openInstall}
              className="bg-[var(--neutral-0)] text-[var(--splash-ink)] hover:bg-[var(--neutral-0)]/90"
            />

            <Link
              to="/registro/cuenta"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] border-[1.5px] border-[var(--neutral-0)]/60 px-[var(--space-6)] text-[15px] leading-[1.2] font-bold text-[var(--neutral-0)] no-underline transition-colors duration-[120ms] hover:border-[var(--neutral-0)]/85 hover:bg-[var(--neutral-0)]/10 motion-reduce:transition-none"
            >
              Crear cuenta
            </Link>
          </div>

          <p className="mt-[var(--space-3)] mb-0 text-[12.5px]">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center px-[var(--space-1)] font-extrabold text-[var(--neutral-0)] underline underline-offset-[3px] hover:no-underline"
            >
              Iniciar sesión
            </Link>
          </p>

          <p className="mt-[var(--space-4)] mb-0 text-[10.5px]">{footer}</p>
        </div>
      </div>

      {isInstallOpen && (
        <InstallSheet platform={install.plataforma} onClose={closeInstall} />
      )}
    </div>
  );
}
