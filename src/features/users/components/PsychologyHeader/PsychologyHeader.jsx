import { LogOut } from 'lucide-react';

export function PsychologyHeader({
  roleLabel,
  onLogout,
}) {
  return (
    <header className="w-full bg-[var(--neutral-900)] text-[var(--neutral-0)]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-[var(--space-4)] p-[var(--space-4)] md:px-[var(--space-7)] md:py-[var(--space-5)]">
        <div className="flex min-w-0 items-center gap-[var(--space-2)]">
          <span className="rounded-[var(--radius-full)] bg-[var(--brand-600)] px-[var(--space-3)] py-[3px] text-[10px] font-extrabold tracking-[0.04em] md:text-[11px]">
            Brisa
          </span>

          <span className="rounded-[var(--radius-full)] border border-[rgb(255_255_255/24%)] bg-[rgb(255_255_255/12%)] px-[var(--space-2)] py-[2px] font-[var(--font-mono)] text-[9.5px] uppercase md:text-[10px]">
            {roleLabel}
          </span>
        </div>

        <button
          type="button"
          className="inline-flex min-h-[32px] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border-0 bg-[rgb(255_255_255/10%)] px-[var(--space-3)] py-[var(--space-1)] text-[12px] font-bold text-[var(--neutral-0)] transition-[background-color] duration-120 hover:bg-[rgb(255_255_255/20%)] motion-reduce:transition-none"
          onClick={onLogout}
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}