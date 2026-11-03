import { Outlet } from 'react-router-dom';

import { RegistrationProvider } from '../../../features/users/context/RegistrationProvider.jsx';

/*
 * Contenedor del registro: proveedor de contexto, único <main> y la
 * tarjeta con la misma composición que el login. Cada paso pinta
 * su propia cabecera dentro.
 */
export function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <main className="flex min-h-screen justify-center bg-[var(--surface-card)] md:items-start md:bg-[var(--surface-bg)] md:p-[var(--space-8)] lg:items-center">
        <section className="w-full max-w-[680px] bg-[var(--surface-card)] px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-9)] md:rounded-[var(--radius-3xl)] md:border md:border-[var(--surface-border)] md:p-[var(--space-8)] md:shadow-[var(--shadow-xl)]">
          <Outlet />
        </section>
      </main>
    </RegistrationProvider>
  );
}
