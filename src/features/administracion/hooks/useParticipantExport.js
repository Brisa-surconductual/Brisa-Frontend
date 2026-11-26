import { useEffect, useRef, useState } from 'react';

import { exportParticipantCsv, getParticipantExportSourceMode } from '../data/participantExportSource.js';
import { normalizeParticipantCode } from '../services/chatTraceabilityIds.js';
import {
  PARTICIPANT_EXPORT_BLOCK as BLOCK,
  PARTICIPANT_EXPORT_ERROR as E,
  PARTICIPANT_EXPORT_SOURCE_MODE,
  PARTICIPANT_EXPORT_STATUS as S,
} from '../types/participantExport.js';
import { startCsvDownload } from '../utils/downloadCsv.js';

const STATUS_BY_CODE = Object.freeze({
  [E.INVALID_CODE]: S.INVALID_CODE,
  [E.SESSION_REQUIRED]: S.SESSION_REQUIRED,
  [E.FORBIDDEN]: S.FORBIDDEN,
  [E.NOT_FOUND]: S.NOT_FOUND,
  [E.INCONSISTENT]: S.INCONSISTENT,
  [E.NO_INDICATORS]: S.NO_INDICATORS,
  [E.UNAVAILABLE]: S.UNAVAILABLE,
  [E.ABORTED]: S.ABORTED,
  [E.CONNECTION]: S.CONNECTION,
  [E.INVALID_RESPONSE]: S.INVALID_RESPONSE,
});

const DEFAULT_SOURCE = Object.freeze({
  getMode: getParticipantExportSourceMode,
  exportCsv: exportParticipantCsv,
  download: (file) => startCsvDownload(file),
});

const IDLE = Object.freeze({ dialogOpen: false, status: S.IDLE, file: null });

/*
 * Exportación CSV individual (RF-145) desde la ficha de seguimiento.
 *
 * - Solo con un seudónimo A7 que `authentic` declare entregado por una
 *   fuente real; nunca la referencia opaca de la ruta ni la demostración.
 * - Abrir o cancelar la confirmación no hace ninguna petición: el GET
 *   sale solo con `confirmExport`, una única vez a la vez (el backend
 *   audita cada exportación).
 * - La descarga empieza solo con el archivo completo y válido; ante
 *   cualquier error no se descarga nada. «Iniciada» no significa
 *   guardada: eso lo decide el navegador.
 * - Al cambiar de participante o salir de la ficha se cancela la
 *   petición en curso y su resultado se descarta.
 */
export function useParticipantExport({ participantCode, authentic = false, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const [state, setState] = useState(IDLE);
  const inFlight = useRef(null);
  const code = authentic ? normalizeParticipantCode(participantCode) : null;

  useEffect(
    () => () => {
      inFlight.current?.abort();
      inFlight.current = null;
    },
    [code],
  );

  const blockedBy =
    mode !== PARTICIPANT_EXPORT_SOURCE_MODE.API ? BLOCK.DEMO : code ? null : BLOCK.IDENTITY_PENDING;

  function openDialog() {
    if (blockedBy || inFlight.current) return;
    setState({ dialogOpen: true, status: S.IDLE, file: null });
  }

  function cancelDialog() {
    if (inFlight.current) return;
    setState(IDLE);
  }

  async function confirmExport() {
    if (blockedBy || inFlight.current) return;

    const controller = new AbortController();
    inFlight.current = controller;
    setState({ dialogOpen: true, status: S.EXPORTING, file: null });

    try {
      const file = await source.exportCsv(code, { signal: controller.signal });
      if (controller.signal.aborted) return;

      try {
        source.download(file);
      } catch {
        setState({ dialogOpen: false, status: S.DOWNLOAD_FAILED, file: null });
        return;
      }

      setState({ dialogOpen: false, status: S.STARTED, file });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ dialogOpen: false, status: STATUS_BY_CODE[error?.code] ?? S.ABORTED, file: null });
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }

  return {
    code,
    blockedBy,
    canExport: !blockedBy,
    dialogOpen: state.dialogOpen,
    status: state.status,
    file: state.file,
    isExporting: state.status === S.EXPORTING,
    openDialog,
    cancelDialog,
    confirmExport,
  };
}
