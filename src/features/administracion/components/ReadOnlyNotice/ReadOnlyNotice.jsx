import { LockKeyhole } from 'lucide-react';

import { getReadOnlyMessage } from '../../services/readOnlyRestriction.js';
import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Aviso de información protegida de solo lectura (RF-148), para las
 * futuras vistas administrativas de consulta de M02, M03, M05, M06 y
 * M07. Hoy no existe ninguna, así que no se monta en ninguna ruta.
 *
 * NO debe usarse en cohortes ni en la asignación o retiro de
 * participantes: esas escrituras están permitidas por RF-148.
 *
 * Por defecto es una nota informativa (role="note"). Para comunicar un
 * rechazo que acaba de ocurrir se pasa role="alert".
 */
export function ReadOnlyNotice({ role = 'note', children }) {
  return (
    <CohortNotice tone="info" icon={LockKeyhole} title="Información de solo lectura" role={role}>
      {children ?? getReadOnlyMessage()}
    </CohortNotice>
  );
}
