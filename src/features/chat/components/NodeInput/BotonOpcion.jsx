// type="button": dentro del <form>, tocar una opción no debe enviarlo.
export function BotonOpcion({ elegida, children, ...props }) {
  const estado = elegida
    ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--text-inverse)]'
    : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-primary)] enabled:hover:border-[var(--brand-400)] enabled:hover:bg-[var(--brand-50)]';

  return (
    <button
      type="button"
      {...props}
      className={`flex min-h-[44px] w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-[1.5px] px-[var(--space-4)] py-[var(--space-2)] text-left text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${estado}`}
    >
      {children}
    </button>
  );
}
