import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

import { conIdPeticion } from '../chatApiUtils.js';

// RF-37: POST /chat/errores-cliente. Cookie y X-CSRF-Token (lo pone
// apiClient). El contrato solo admite `codigo` y, opcional, `id_sesion`:
// el cuerpo se arma con esos dos campos y nada más. Responde 204.
export async function reportarErrorCliente({ codigo, idSesion = null }) {
  const cuerpo = idSesion ? { codigo, id_sesion: idSesion } : { codigo };

  try {
    await apiClient.post(`${CHAT}/errores-cliente`, cuerpo, conIdPeticion());
  } catch (error) {
    throw toApiError(error);
  }
}
