import { Button } from '@/shared/components/ui/Button/index.js';
import {
  ADMINISTRATIVE_PAUSE_STATUS,
  ADMINISTRATIVE_PAUSE_STATUS_LABEL,
} from '@/features/cronograma/types/administrativePauseTypes.js';

const STATUS_CLASS = Object.freeze({
  'ACTIVA': 'bg-[var(--brand-100)] text-[var(--brand-700)]',
  'FINALIZADA': 'bg-[var(--success-bg)] text-[var(--success-text)]',
  'ANULADA': 'bg-[var(--neutral-100)] text-[var(--text-muted)]',
});

export function AdministrativePauseCard({ pause, onAnnul }) {
  
  const {
    fechaInicio,
    fechaFin,
    motivo,
    estado, 
    correoElectronico,
    correoUsuarioAdministrativo,
  } = pause;

  const statusLabel = ADMINISTRATIVE_PAUSE_STATUS_LABEL[estado] ?? estado;
  const canAnnul = estado === 'ACTIVA';

  const emailAfectado = correoElectronico?.value || correoElectronico || 'Desconocido';
  const emailAdmin = correoUsuarioAdministrativo?.value || correoUsuarioAdministrativo || 'N/A';

  const fechaInicioLimpia = fechaInicio ? fechaInicio.split('T')[0] : 'N/A';
  const fechaFinLimpia = fechaFin ? fechaFin.split('T')[0] : 'N/A';

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)] border-b border-[var(--surface-border)] pb-3">
        <div>
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Usuario Afectado
          </p>
          <h2 className="mt-1 mb-0 text-[15px] font-extrabold text-[var(--text-primary)]">
            {emailAfectado}
          </h2>
        </div>

        <span
          className={`rounded-[var(--radius-full)] px-3 py-1 text-[10px] font-extrabold tracking-[0.03em] uppercase ${
            STATUS_CLASS[estado] ?? 'bg-[var(--neutral-100)] text-[var(--text-muted)]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        
        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Fecha de Inicio
          </dt>
          <dd className="mt-1 ml-0 text-[13px] font-bold text-[var(--text-primary)]">
             {fechaInicioLimpia}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Fecha de Fin
          </dt>
          <dd className="mt-1 ml-0 text-[13px] font-bold text-[var(--text-primary)]">
             {fechaFinLimpia}
          </dd>
        </div>

        {/* Motivo */}
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Motivo de la Pausa
          </dt>
          <dd className="mt-1 ml-0 text-[13px] leading-[1.5] text-[var(--text-primary)] bg-[var(--surface-bg)] p-2.5 rounded-[var(--radius-md)] border border-[var(--surface-border)]">
            {motivo}
          </dd>
        </div>

        {/* Administrador Responsable */}
        <div className="sm:col-span-2 pt-2 border-t border-[var(--surface-border)] flex items-center justify-between text-[12px]">
          <span className="text-[var(--text-muted)] font-medium">Registrado por Admin:</span>
          <span className="font-bold text-[var(--text-secondary)]">{emailAdmin}</span>
        </div>

      </dl>

      <div className="mt-4 flex justify-end pt-2">
        <Button variant="danger" disabled={!canAnnul} onClick={onAnnul}>
          Anular pausa
        </Button>
      </div>

    </article>
  );
}