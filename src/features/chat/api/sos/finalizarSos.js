import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

import { conIdPeticion } from '../chatApiUtils.js';

// RF-43: POST /chat/sos/{id_intervencion}/finalizar con `{ motivo }`.
// Llegar al nodo final no cierra la intervención: el cierre siempre es
// este POST. El estado y la duración definitivos los decide el backend.
export async function finalizarSos(idIntervencion, motivo) {
  try {
    const response = await apiClient.post(
      `${CHAT}/sos/${encodeURIComponent(idIntervencion)}/finalizar`,
      { motivo },
      conIdPeticion(),
    );

    return response.data?.data;
  } catch (error) {
    throw toApiError(error);
  }
}
