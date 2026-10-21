import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';
import { CONSENT_STATUS } from '../types/registrationStatus.js';

export const validarConsentimiento = async (payload) => {
    const { data } = await apiClient.post(`${USUARIOS}/actualizar-consentimiento`, payload);
    return data;
}

export async function renovarConsentimientoRegistro({
  idUsuario,
  consentimiento,
  personalDataAccepted,
  consumptionHistoryAccepted,
}) {
  if (!personalDataAccepted || !consumptionHistoryAccepted) {
    throw new Error('Debes aceptar ambas autorizaciones para continuar.');
  }

  if (
    !consentimiento?.vigente ||
    !consentimiento.idConsentimeinto ||
    !consentimiento.versionConsetimeinto ||
    !consentimiento.urlContenido
  ) {
    throw new Error('No se pudo obtener el documento de consentimiento vigente.');
  }

  // El registro conserva el borrador en memoria hasta su confirmación final.
  // Solo una cuenta ya existente puede actualizarse mediante este endpoint.
  if (idUsuario) {
    await validarConsentimiento({
      idUsuario,
      idConsentimeinto: consentimiento.idConsentimeinto,
    });
  }

  return {
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion: consentimiento.versionConsetimeinto,
    idConsentimeinto: consentimiento.idConsentimeinto,
    status: CONSENT_STATUS.VALID,
  };
}
