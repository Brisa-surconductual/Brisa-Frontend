import { PROGRAM_STATS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import { useProgramStats } from '../hooks/useProgramStats.js';

const TONE_CLASS = Object.freeze({
  brand: 'text-[var(--brand-600)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  info: 'text-[var(--info)]',
});

export function DashboardPanel() {
  const { stats, loading, error, retry } = useProgramStats();
  const formatter = new Intl.NumberFormat('es-CO');
  return (
    <section aria-label="Resumen del programa" aria-busy={loading}>
      <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {PROGRAM_STATS.map(({ id, key, label, tone }) => (
          <li
            key={id}
            className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)] lg:min-h-[130px]"
          >
            <p
              className={`m-0 text-[26px] leading-[1.1] font-extrabold md:text-[30px] ${TONE_CLASS[tone] ?? 'text-[var(--text-primary)]'}`}
            >
              {stats?.[key] == null ? '—' : formatter.format(stats[key])}
            </p>

            <p className="mt-[var(--space-1)] mb-0 text-[11px] leading-[1.4] text-[var(--text-muted)] md:text-[12px]">
              {label}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-5)] flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        {loading ? (
          <p role="status" className="m-0 text-[13px] text-[var(--text-muted)]">
            Consultando estadísticas...
          </p>
        ) : error ? (
          <p role="alert" className="m-0 text-[13px] text-[var(--danger-text)]">
            {error}
          </p>
        ) : (
          <p className="m-0 text-[12px] text-[var(--text-muted)]">
            Cuentas de estudiantes activas. La duración corresponde al
            cronograma base activo.
          </p>
        )}
        <Button
          variant="secondary"
          size="small"
          disabled={loading}
          onClick={retry}
        >
          {error ? 'Reintentar consulta' : 'Actualizar estadísticas'}
        </Button>
      </div>
      {!loading && !error && stats?.diasCronogramaBase === null && (
        <p className="mt-[var(--space-3)] mb-0 text-[12px] text-[var(--text-muted)]">
          La duración estará disponible cuando haya un cronograma base activo
          con unidades temporales.
        </p>
      )}
    </section>
  );
}
