/*
 * Contenedor de las pantallas públicas sin layout propio (como la
 * recuperación de contraseña): aporta el único <main> y la tarjeta
 * con la misma composición que el formulario del login.
 */
export function AuthCardShell({ children }) {
  return (
    <div className="min-h-screen bg-[var(--surface-card)] md:flex md:items-center md:justify-center md:bg-[var(--surface-bg)] md:p-[var(--space-8)]">
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-6)] px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-9)] md:rounded-[var(--radius-2xl)] md:border md:border-[var(--surface-border)] md:bg-[var(--surface-card)] md:p-[var(--space-8)] md:shadow-[var(--shadow-lg)]">
        {children}
      </main>
    </div>
  );
}
