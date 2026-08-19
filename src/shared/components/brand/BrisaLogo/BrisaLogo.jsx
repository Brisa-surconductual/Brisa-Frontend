export function BrisaLogo() {
  return (
    <div className="inline-flex items-center gap-[var(--space-3)]" aria-label="Brisa, apoyo psicoeducativo">
      <span className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-500)] text-[var(--text-inverse)]" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 22 C9 21, 11 18, 13 19 C15 20, 16 15, 19 13 C21.5 11.3, 23 11.5, 25 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <circle
            cx="25"
            cy="10"
            r="2.3"
            fill="currentColor"
          />

          <path
            d="M9 25 C9 23.5, 10.5 22.5, 12 22.5"
            stroke="#a8e0d8"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="flex flex-col">
        <strong className="text-[18px] leading-[1.15] font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
          Brisa
        </strong>

        <span className="mt-[2px] text-[11px] font-medium text-[var(--text-muted)]">
          Apoyo psicoeducativo
        </span>
      </span>
    </div>
  );
}