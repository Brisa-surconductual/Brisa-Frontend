import { useEffect, useRef, useState } from 'react';

import {
  exportCohortIndicatorsCsv,
  getExportSourceMode,
} from '../data/cohortExportSource.js';
import {
  EXPORT_ERROR,
  EXPORT_SOURCE_MODE,
  EXPORT_STATUS,
} from '../types/cohortExport.js';
import { startCsvDownload } from '../utils/downloadCsv.js';

const STATUS_BY_CODE = Object.freeze({
  [EXPORT_ERROR.SESSION_REQUIRED]: EXPORT_STATUS.SESSION_REQUIRED,
  [EXPORT_ERROR.FORBIDDEN]: EXPORT_STATUS.FORBIDDEN,
  [EXPORT_ERROR.COHORT_NOT_ACTIVE]: EXPORT_STATUS.COHORT_NOT_ACTIVE,
  [EXPORT_ERROR.NO_INDICATORS]: EXPORT_STATUS.NO_INDICATORS,
  [EXPORT_ERROR.GENERATION_FAILED]: EXPORT_STATUS.GENERATION_FAILED,
  [EXPORT_ERROR.AUDIT_UNAVAILABLE]: EXPORT_STATUS.AUDIT_UNAVAILABLE,
});

const DEFAULT_SOURCE = Object.freeze({
  getMode: getExportSourceMode,
  exportCsv: exportCohortIndicatorsCsv,
  download: (file) => startCsvDownload(file),
});

/*
 * Exportación CSV de indicadores de la cohorte activa (RF-144). La
 * descarga solo se inicia cuando la fuente entrega el archivo completo
 * (y, en demostración, después de la auditoría simulada); ante cualquier
 * error no se descarga nada. Una segunda activación mientras se genera
 * el archivo se ignora. `source` permite sustituirlo en las pruebas.
 */
export function useCohortExport({ cohortId, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const [state, setState] = useState({
    status: EXPORT_STATUS.IDLE,
    file: null,
  });
  const inFlight = useRef(null);

  useEffect(
    () => () => {
      inFlight.current?.abort();
      inFlight.current = null;
    },
    [],
  );

  async function exportCsv() {
    if (!cohortId || inFlight.current) return;

    const controller = new AbortController();
    inFlight.current = controller;
    setState({ status: EXPORT_STATUS.EXPORTING, file: null });

    try {
      const file = await source.exportCsv(cohortId, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      try {
        source.download(file);
      } catch {
        setState({ status: EXPORT_STATUS.DOWNLOAD_FAILED, file: null });
        return;
      }

      setState({ status: EXPORT_STATUS.STARTED, file });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: STATUS_BY_CODE[error?.code] ?? EXPORT_STATUS.GENERATION_FAILED,
        file: null,
      });
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }

  return {
    status: state.status,
    file: state.file,
    isExporting: state.status === EXPORT_STATUS.EXPORTING,
    isDemo: mode === EXPORT_SOURCE_MODE.DEMO,
    exportCsv,
  };
}
