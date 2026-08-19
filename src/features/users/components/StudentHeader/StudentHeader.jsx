import { LogOut } from 'lucide-react';

export function StudentHeader({
  displayName,
  roleLabel,
  onLogout,
}) {
  return (
    <header className="w-full bg-[var(--brand-500)] text-[var(--button-primary-text)]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-[var(--space-3)] p-[var(--space-4)] md:px-[var(--space-7)] md:py-[var(--space-5)]">
        <div className="flex min-w-0 items-center gap-[var(--space-2)]">
          <span className="flex shrink-0 text-[var(--button-primary-text)]" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 22 C7 21, 9 18, 11 19 C13 20, 14 15, 17 13 C19.5 11.3, 21 11.5, 23 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="23"
                cy="10"
                r="2.2"
                fill="currentColor"
              />
            </svg>
          </span>

          <span className="flex min-w-0 flex-col">
            <strong className="text-[13px] leading-[1.3] font-extrabold md:text-[15px]">
              Brisa
            </strong>

            <span className="overflow-hidden text-[11px] leading-[1.4] text-ellipsis whitespace-nowrap opacity-78 md:text-[12px]">
              Hola, {displayName}
              {roleLabel && ` · ${roleLabel}`}
            </span>
          </span>
        </div>

        <button
          type="button"
          className="inline-flex min-h-[34px] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border-0 bg-[rgb(255_255_255/18%)] px-[var(--space-3)] py-[var(--space-2)] text-[12px] font-bold text-[var(--button-primary-text)] transition-[background-color] duration-120 hover:bg-[rgb(255_255_255/28%)] motion-reduce:transition-none [html[data-theme='dark']_&]:bg-[rgb(0_0_0/20%)] [html[data-theme='dark']_&]:hover:bg-[rgb(0_0_0/32%)]"
          onClick={onLogout}
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span className="leading-none">
            Salir
          </span>
        </button>
      </div>
    </header>
  );
}