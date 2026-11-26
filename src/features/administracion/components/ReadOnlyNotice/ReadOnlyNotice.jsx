import { LockKeyhole } from 'lucide-react';

import { getReadOnlyMessage } from '../../services/readOnlyRestriction.js';
import { CohortNotice } from '../CohortNotice/index.js';

/*
 * RF-148. Las vistas de consulta lo usan como nota informativa.
 * Un rechazo del backend se anuncia con role="alert".
 */
export function ReadOnlyNotice({ role = 'note', children }) {
  return (
    <CohortNotice tone="info" icon={LockKeyhole} title="Información de solo lectura" role={role}>
      {children ?? getReadOnlyMessage()}
    </CohortNotice>
  );
}
