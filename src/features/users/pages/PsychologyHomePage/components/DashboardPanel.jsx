import { PROGRAM_STATS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

const TONE_CLASS = Object.freeze({
  brand: 'text-[var(--brand-600)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  info: 'text-[var(--info)]',
});

export function DashboardPanel() {
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {PROGRAM_STATS.map(({ id, value, label, tone }) => (
          <li
            key={id}
            className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)] lg:min-h-[130px]"
          >
            <p className={`m-0 text-[26px] leading-[1.1] font-extrabold md:text-[30px] ${TONE_CLASS[tone] ?? 'text-[var(--text-primary)]'}`}>
              {value}
            </p>

            <p className="mt-[var(--space-1)] mb-0 text-[11px] leading-[1.4] text-[var(--text-muted)] md:text-[12px]">
              {label}
            </p>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-[var(--space-5)] mb-0 max-w-[720px] text-center text-[11px] leading-[1.5] text-[var(--text-muted)] md:text-[12px]">
        Cifras de ejemplo, agregadas y anónimas. Los módulos de reportes y
        métricas estarán disponibles en M04 y M08.
      </p>
    </>
  );
}