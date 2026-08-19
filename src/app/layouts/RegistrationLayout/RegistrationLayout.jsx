import { Outlet } from 'react-router-dom';

import { RegistrationProvider } from '../../../features/users/context/RegistrationProvider.jsx';

export function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <main className="flex min-h-screen justify-center bg-[var(--surface-bg)] md:items-center md:p-[var(--space-8)]">
        <section className="min-h-screen w-full max-w-[760px] bg-[var(--surface-card)] px-[var(--space-5)] pt-[var(--space-7)] pb-[var(--space-9)] md:min-h-0 md:rounded-[var(--radius-xl)] md:border md:border-[var(--surface-border)] md:p-[var(--space-7)] md:shadow-[var(--shadow-md)]">
          <Outlet />
        </section>
      </main>
    </RegistrationProvider>
  );
}