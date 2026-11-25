import { fetchCohortExportCsv } from '../api/cohortExportApi.js';
import { EXPORT_SOURCE_MODE } from '../types/cohortExport.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

async function loadExportDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error('La demostración de exportación está desactivada.');
  }

  return import('./cohortExportDemoSource.js');
}

export function getExportSourceMode() {
  return isCohortDemoEnabled()
    ? EXPORT_SOURCE_MODE.DEMO
    : EXPORT_SOURCE_MODE.API;
}

export async function exportCohortIndicatorsCsv(cohortId, request = {}) {
  if (isCohortDemoEnabled()) {
    return (await loadExportDemoSource()).exportCohortIndicatorsCsv(
      cohortId,
      request,
    );
  }
  return fetchCohortExportCsv(cohortId, request);
}
