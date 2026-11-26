import { useId, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Download, ShieldAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { useParticipantExport } from '../../hooks/useParticipantExport.js';
import {
  PARTICIPANT_EXPORT_BLOCK as BLOCK,
  PARTICIPANT_EXPORT_STATUS as S,
} from '../../types/participantExport.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { ParticipantExportDialog } from '../ParticipantExportDialog/index.js';

const NO_FILE = 'No se descargó ningún archivo.';

// Mensajes propios de la interfaz: sin detalles técnicos ni datos sensibles.
const MESSAGE = Object.freeze({
  [S.INVALID_CODE]: `El código del participante no es válido. ${NO_FILE}`,
  [S.SESSION_REQUIRED]: `Tu sesión no está activa. Vuelve a iniciar sesión para exportar el archivo. ${NO_FILE}`,
  [S.FORBIDDEN]: `Tu cuenta no tiene autorización para exportar la información individual de este participante. ${NO_FILE}`,
  [S.NOT_FOUND]: `El participante solicitado no existe en el sistema. ${NO_FILE}`,
  [S.INCONSISTENT]: `La información de seguimiento no corresponde al participante solicitado. Por seguridad, ${NO_FILE.toLowerCase()}`,
  [S.NO_INDICATORS]: `El participante todavía no tiene indicadores exportables. ${NO_FILE}`,
  [S.UNAVAILABLE]: `El seguimiento no está disponible temporalmente. Inténtalo más tarde. ${NO_FILE}`,
  [S.ABORTED]: `La exportación no pudo completarse. ${NO_FILE}`,
  [S.CONNECTION]: `No hubo respuesta del servidor. Comprueba tu conexión e inténtalo de nuevo. ${NO_FILE}`,
  [S.INVALID_RESPONSE]: `El archivo recibido no tiene el formato esperado. ${NO_FILE}`,
  [S.DOWNLOAD_FAILED]: 'El archivo se generó, pero el navegador no pudo iniciar la descarga. Inténtalo de nuevo.',
});

// Estados que dependen de permisos o datos, no de un fallo.
const WARNING = Object.freeze([S.FORBIDDEN, S.NO_INDICATORS, S.SESSION_REQUIRED, S.UNAVAILABLE]);

const BLOCK_HINT = Object.freeze({
  [BLOCK.DEMO]: 'No disponible en la demostración.',
  [BLOCK.IDENTITY_PENDING]: 'Disponible cuando la ficha muestre el código verificado del participante.',
});

function ExportResult({ status, file }) {
  if (status === S.STARTED && file) {
    return (
      <CohortNotice tone="success" icon={CheckCircle2} title="Descarga iniciada" role="status">
        Se entregó al navegador el archivo {file.fileName}. Comprueba que se
        haya guardado en tu dispositivo.
      </CohortNotice>
    );
  }

  const message = MESSAGE[status];

  if (!message) return null;

  return (
    <CohortNotice
      tone={WARNING.includes(status) ? 'warning' : 'danger'}
      icon={status === S.FORBIDDEN ? ShieldAlert : AlertTriangle}
      title="No se exportó el archivo"
      role="alert"
    >
      {message}
    </CohortNotice>
  );
}

/*
 * Acción «Exportar CSV» de la ficha de seguimiento (RF-145). Solo inicia
 * una consulta tras la confirmación del modal; la ficha sigue siendo de
 * consulta. Sin un seudónimo real verificado, o en la demostración, la
 * acción queda deshabilitada con un aviso breve.
 */
export function ParticipantExportButton({ participantCode, authentic = false }) {
  const exportState = useParticipantExport({ participantCode, authentic });
  const { code, blockedBy, canExport, dialogOpen, status, file, isExporting } = exportState;
  const triggerRef = useRef(null);
  const hintId = useId();
  const hint = BLOCK_HINT[blockedBy];

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-center sm:gap-[var(--space-3)]">
        <Button
          ref={triggerRef}
          variant="secondary"
          onClick={exportState.openDialog}
          disabled={!canExport || isExporting}
          aria-haspopup="dialog"
          aria-describedby={hint ? hintId : undefined}
          className="min-h-[44px] w-fit"
        >
          <Download size={16} strokeWidth={2} aria-hidden="true" />
          Exportar CSV
          <span className="sr-only"> del historial de seguimiento</span>
        </Button>

        {hint && (
          <p id={hintId} className="m-0 text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>

      <div aria-live="polite">
        <ExportResult status={status} file={file} />
      </div>

      {canExport && (
        <ParticipantExportDialog
          open={dialogOpen}
          participantCode={code}
          exporting={isExporting}
          onCancel={exportState.cancelDialog}
          onConfirm={exportState.confirmExport}
          returnFocusRef={triggerRef}
        />
      )}
    </div>
  );
}
