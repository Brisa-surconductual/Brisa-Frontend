import { fetchAuditRecords } from '../api/listAuditRecords.js';
import { AUDIT_SOURCE_MODE } from '../types/auditSource.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

export function getAuditSourceMode() {
  return isCohortDemoEnabled() ? AUDIT_SOURCE_MODE.DEMO : AUDIT_SOURCE_MODE.API;
}

export async function listAuditRecords(options) {
  if (import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true') {
    const demo = await import('./auditDemoSource.js');
    return { records: await demo.listAuditRecords(), nextCursor: null };
  }

  return fetchAuditRecords(options);
}
