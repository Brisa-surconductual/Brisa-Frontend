export function ScheduleCard({ schedule, onClick }) {
  const nombre = schedule.nombreCronograma || 'Sin nombre';
  const estado = schedule.estado || 'DESCONOCIDO';
  const fecha = schedule.fechaCreacion ? schedule.fechaCreacion.split('T')[0] : 'Sin fecha';

  const estadoStyles = estado === 'ACTIVO' 
    ? 'bg-[var(--brand-100)] text-[var(--brand-700)]' 
    : 'bg-gray-100 text-gray-600';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-[var(--space-5)] min-h-[140px] flex flex-col justify-between rounded-xl border border-gray-200 bg-white hover:border-[var(--brand-400)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[16px] font-extrabold text-[var(--text-primary)] m-0 leading-tight">
            {nombre}
          </h3>
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${estadoStyles}`}>
            {estado}
          </span>
        </div>
        <p className="m-0 text-[13px] text-[var(--text-muted)] font-medium">
          Creado: <span className="text-gray-700 font-semibold">{fecha}</span>
        </p>
      </div>

      <div className="mt-4 flex items-center text-[12px] font-bold text-[var(--brand-600)] uppercase tracking-wider">
        Ver panel de gestión →
      </div>
    </div>
  );
}