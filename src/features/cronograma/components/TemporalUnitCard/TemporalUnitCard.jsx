export function TemporalUnitCard({ unit, onViewDetails }) {
  const {
    nombreUnidadTemporal,
    orden,
    fechaInicio,
    fechaFin,
    status,
    esUtilizadoPorUsuario
  } = unit;

  const statusStyles = {
    'ACTIVA': 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
    'COMPLETADA': 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-bg)]',
    'BLOQUEADA': 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--surface-border)]',
    'POR_DEFINIR': 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-transparent'
  };

  const badgeStyle = statusStyles[status] || statusStyles['POR_DEFINIR'];

  return (
    <article className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-white p-[var(--space-4)] transition-all duration-200 hover:border-[var(--brand-300)] hover:shadow-sm">
      
      <div className="flex items-start sm:items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-bg)] text-[14px] font-extrabold text-[var(--text-secondary)]">
          {orden ?? '-'}
        </div>
        
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="m-0 text-[15px] font-bold text-[var(--text-primary)]">
              {nombreUnidadTemporal}
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${badgeStyle}`}>
              {status}
            </span>
          </div>
          
          <div className="mt-1 flex flex-wrap items-center gap-4 text-[12px] font-medium text-[var(--text-muted)]">
            <span> {fechaInicio?.split('T')[0]} — {fechaFin?.split('T')[0]}</span>
            {esUtilizadoPorUsuario && (
              <span className="text-[var(--brand-600)] font-bold">
                • En uso
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onViewDetails}
        className="shrink-0 rounded-[var(--radius-md)] px-4 py-2 text-[12px] font-bold text-[var(--brand-600)] transition-colors hover:bg-[var(--brand-50)]"
      >
        Ver detalles →
      </button>
    </article>
  );
}