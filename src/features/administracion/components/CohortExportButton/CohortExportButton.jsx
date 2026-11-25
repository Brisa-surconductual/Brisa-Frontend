import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { useCohortExport } from '../../hooks/useCohortExport.js';
import { EXPORT_STATUS } from '../../types/cohortExport.js';
import { COHORT_STATUS } from '../../types/cohortStatus.js';
import { EXPORT_MESSAGE } from '../../utils/exportMessages.js';
import { CohortNotice } from '../CohortNotice/index.js';

const DENIED = Object.freeze([
  EXPORT_STATUS.SESSION_REQUIRED,
  EXPORT_STATUS.FORBIDDEN,
  EXPORT_STATUS.COHORT_NOT_ACTIVE,
  EXPORT_STATUS.NO_INDICATORS,
]);

function ExportResult({ status, file, isDemo }) {
  if (status === EXPORT_STATUS.STARTED && file) {
    return (
      <CohortNotice
        tone="success"
        icon={CheckCircle2}
        title="Descarga iniciada"
        role="status"
      >
        Se entregó al navegador el archivo {file.fileName}
        {isDemo ? ', con indicadores ficticios de demostración' : ''}.
        {!file.notificationsAvailable &&
          ' Las métricas de notificaciones no estaban disponibles y se marcaron como «No disponible».'}
        {file.behavioralStale &&
          ' La vista conductual está desactualizada: el archivo lo indica en la columna estado_vista_conductual.'}
      </CohortNotice>
    );
  }

  const message = EXPORT_MESSAGE[status];

  if (!message) return null;

  return (
    <CohortNotice
      tone={DENIED.includes(status) ? 'warning' : 'danger'}
      icon={status === EXPORT_STATUS.FORBIDDEN ? ShieldAlert : AlertTriangle}
      title="No se descargó el archivo"
      role="alert"
    >
      {message}
    </CohortNotice>
  );
}

/*
 * Exportación CSV de los indicadores agregados de la cohorte activa
 * (RF-144), en el detalle de la cohorte. Solo agregados de RF-132 y
 * RF-134; no hay opción de exportar datos individuales. El botón queda
 * deshabilitado mientras se genera el archivo, si la cohorte no está
 * activa.
 */
export function CohortExportButton({ cohortId, cohortName, cohortStatus }) {
  const { status, file, isExporting, isDemo, exportCsv } = useCohortExport({
    cohortId,
  });
  const isActive = cohortStatus === COHORT_STATUS.ACTIVE;

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-center sm:gap-[var(--space-3)]">
        <Button
          variant="secondary"
          onClick={exportCsv}
          loading={isExporting}
          loadingText="Generando CSV..."
          disabled={!isActive}
          className="min-h-[44px]"
        >
          <Download size={16} strokeWidth={2} aria-hidden="true" />
          Exportar indicadores CSV
          {cohortName && <span className="sr-only"> de {cohortName}</span>}
        </Button>

        <p className="m-0 text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
          {!isActive
            ? 'Disponible solo para la cohorte activa.'
            : isDemo
              ? 'Datos de demostración: el archivo contiene indicadores ficticios. Solo agregados de la cohorte, sin datos personales.'
              : 'Solo agregados de la cohorte, sin datos personales.'}
        </p>
      </div>

      <div aria-live="polite">
        <ExportResult status={status} file={file} isDemo={isDemo} />
      </div>
    </div>
  );
}
