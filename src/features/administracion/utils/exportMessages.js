import { EXPORT_STATUS } from '../types/cohortExport.js';

// Mensajes de la exportación CSV. Los de FA1, FA2, FA3 y FA5 son los
// oficiales de RF-144; los demás son propios de la interfaz.
export const EXPORT_MESSAGE = Object.freeze({
  [EXPORT_STATUS.FORBIDDEN]:
    'Acceso denegado. No cuenta con los privilegios necesarios para exportar datos del módulo administrativo.',
  [EXPORT_STATUS.SESSION_REQUIRED]:
    'Tu sesión no está activa. Vuelve a iniciar sesión para exportar el archivo.',
  [EXPORT_STATUS.COHORT_NOT_ACTIVE]:
    'No se puede exportar. La cohorte seleccionada no está activa o no existe en el sistema.',
  [EXPORT_STATUS.NO_INDICATORS]:
    'La cohorte activa no contiene datos de indicadores para exportar. Por favor, espere a que el sistema procese los datos.',
  [EXPORT_STATUS.GENERATION_FAILED]:
    'Ocurrió un error al generar el archivo CSV. Por favor, intente nuevamente o contacte a soporte.',
  [EXPORT_STATUS.AUDIT_UNAVAILABLE]:
    'No fue posible registrar la exportación en la bitácora de auditoría, por lo que la descarga no se realizó. Intente nuevamente más tarde.',
  [EXPORT_STATUS.DOWNLOAD_FAILED]:
    'El archivo se generó, pero el navegador no pudo iniciar la descarga. Intente nuevamente.',
});
