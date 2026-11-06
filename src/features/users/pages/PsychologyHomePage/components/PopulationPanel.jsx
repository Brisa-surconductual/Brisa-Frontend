import {
  ChartNoAxesColumn,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

import {
  FACULTY_DISTRIBUTION,
  POPULATION_AVERAGES,
} from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

import {
  getSharePercentage,
  sumCounts,
} from '../utils/aggregates.js';

/*
 * Población aún no consulta el backend: sus cifras son datos de
 * ejemplo. Se rotulan como demostrativos en cada bloque para que
 * no se lean como estadísticas reales del programa.
 */
function ExampleChip() {
  return (
    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--warning-text)]">
      <FlaskConical size={12} strokeWidth={2} aria-hidden="true" />
      Ejemplo
    </span>
  );
}

function PanelCard({ id, icon: Icon, title, children }) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-b border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <div className="flex min-w-0 items-center gap-[var(--space-3)]">
          <span
            className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
            aria-hidden="true"
          >
            <Icon size={18} strokeWidth={1.8} />
          </span>

          <h2
            id={id}
            className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
          >
            {title}
          </h2>
        </div>

        <ExampleChip />
      </div>

      {children}
    </section>
  );
}

export function PopulationPanel() {
  const total = sumCounts(
    FACULTY_DISTRIBUTION,
  );

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="grid grid-cols-1 gap-[var(--space-3)] md:grid-cols-2">
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--info-text)]">
          <ShieldCheck
            size={20}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[length:var(--font-size-sm)]">
              Vista agregada y anónima
            </strong>

            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
              El perfil administrativo solo consulta estadísticas del grupo.
              El acceso a datos individuales identificables requiere
              consentimiento específico y llega en M08.
            </p>
          </div>
        </div>

        <div
          className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--warning-text)]"
          role="note"
        >
          <FlaskConical
            size={20}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[length:var(--font-size-sm)]">
              Datos demostrativos
            </strong>

            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
              Las cifras de esta sección son ejemplos para ilustrar la
              vista. No provienen del backend ni describen a la población
              real del programa.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-5)] lg:grid-cols-2 lg:gap-[var(--space-6)]">
        <PanelCard
          id="poblacion-facultad-titulo"
          icon={GraduationCap}
          title="Distribución por facultad"
        >
          <ul className="m-0 flex list-none flex-col gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)] md:px-[var(--space-5)]">
            {FACULTY_DISTRIBUTION.map(
              ({
                id,
                label,
                count,
              }) => {
                const share = getSharePercentage(
                  count,
                  total,
                );

                return (
                  <li
                    key={id}
                    className="flex flex-col gap-[var(--space-2)]"
                  >
                    <div className="flex items-baseline justify-between gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
                      <span className="min-w-0 text-[var(--text-secondary)]">
                        {label}
                      </span>

                      <span className="inline-flex shrink-0 items-baseline gap-[var(--space-2)] text-right font-bold text-[var(--text-primary)] tabular-nums">
                        {count}

                        <span className="font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-medium text-[var(--text-secondary)]">
                          {share}{' '}
                          %
                        </span>
                      </span>
                    </div>

                    <span
                      className="block h-[8px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-[var(--radius-full)] bg-[var(--brand-500)]"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                  </li>
                );
              },
            )}
          </ul>
        </PanelCard>

        <PanelCard
          id="poblacion-promedios-titulo"
          icon={ChartNoAxesColumn}
          title="Promedios del grupo"
        >
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 md:px-[var(--space-5)]">
            {POPULATION_AVERAGES.map(
              ({
                id,
                label,
                value,
              }) => (
                <div
                  key={id}
                  className="flex flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)]"
                >
                  <dt className="text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                    {label}
                  </dt>

                  <dd className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums">
                    {value}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </PanelCard>
      </div>
    </div>
  );
}
