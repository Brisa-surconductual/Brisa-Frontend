import { Info } from 'lucide-react';

import {
  FACULTY_DISTRIBUTION,
  POPULATION_AVERAGES,
} from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

import {
  getSharePercentage,
  sumCounts,
} from '../utils/aggregates.js';

export function PopulationPanel() {
  const total = sumCounts(
    FACULTY_DISTRIBUTION,
  );

  return (
    <>
      <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-3)] text-[var(--info-text)] md:p-[var(--space-4)]">
        <Info
          size={20}
          strokeWidth={1.8}
          className="mt-px shrink-0"
          aria-hidden="true"
        />

        <div>
          <strong className="block text-[13px] md:text-[14px]">
            Vista agregada y anónima
          </strong>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] opacity-90 md:text-[13px]">
            El perfil administrativo solo consulta estadísticas del grupo.
            El acceso a datos individuales identificables requiere
            consentimiento específico y llega en M08.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-5)] lg:grid-cols-2 lg:gap-[var(--space-6)]">
        <section>
          <h3 className="mt-[var(--space-5)] mb-[var(--space-2)] text-[11px] font-bold tracking-[0.1em] text-[var(--text-secondary)] uppercase">
            Distribución por facultad
          </h3>

          <ul className="m-0 list-none rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] shadow-[var(--shadow-sm)] md:px-[var(--space-5)] md:py-[var(--space-3)]">
            {FACULTY_DISTRIBUTION.map(
              ({
                id,
                label,
                count,
              }) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--surface-hover)] py-[var(--space-3)] text-[12px] last:border-b-0 md:text-[13px]"
                >
                  <span className="min-w-0 text-[var(--text-muted)]">
                    {label}
                  </span>

                  <span className="inline-flex shrink-0 items-baseline gap-[var(--space-2)] text-right font-semibold text-[var(--text-primary)]">
                    {count}

                    <span className="font-[var(--font-mono)] text-[10px] font-medium text-[var(--text-muted)]">
                      {getSharePercentage(
                        count,
                        total,
                      )}{' '}
                      %
                    </span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>

        <section>
          <h3 className="mt-[var(--space-5)] mb-[var(--space-2)] text-[11px] font-bold tracking-[0.1em] text-[var(--text-secondary)] uppercase">
            Promedios del grupo
          </h3>

          <ul className="m-0 list-none rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] shadow-[var(--shadow-sm)] md:px-[var(--space-5)] md:py-[var(--space-3)]">
            {POPULATION_AVERAGES.map(
              ({
                id,
                label,
                value,
              }) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--surface-hover)] py-[var(--space-3)] text-[12px] last:border-b-0 md:text-[13px]"
                >
                  <span className="min-w-0 text-[var(--text-muted)]">
                    {label}
                  </span>

                  <span className="inline-flex shrink-0 items-baseline gap-[var(--space-2)] text-right font-semibold text-[var(--text-primary)]">
                    {value}
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>
    </>
  );
}