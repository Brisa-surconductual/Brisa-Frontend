import { Suspense } from 'react';

import { useAuth } from '@/app/providers/index.js';
import { LandingPage } from '@/features/landing/index.js';
import { installPromptStore } from '@/features/users/index.js';

import { getHomePathForRole } from './roleRoutes.js';

/*
 * Ruta pública «/». Conecta la landing con la sesión y con el almacén de
 * instalación de la PWA: las features no se importan entre sí, así que lo
 * hace la capa de app. La landing se descarga bajo demanda (React.lazy).
 */
export function LandingRoute() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh bg-[var(--neutral-900)]"
          aria-hidden="true"
        />
      }
    >
      <LandingPage
        isAuthenticated={isAuthenticated}
        homePath={getHomePathForRole(role)}
        installStore={installPromptStore}
      />
    </Suspense>
  );
}
