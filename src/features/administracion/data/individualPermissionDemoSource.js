import { getCurrentDateInBogota } from '@/shared/utils/dateUtils.js';
import { toApiError } from '@/shared/utils/apiError.js';

import { PERMISSION_ERROR } from '../types/permissionScope.js';
import {
  getPermissionDemoScenario,
  PERMISSION_DEMO_SCENARIO,
} from '../utils/individualPermissionDemoScenario.js';
import {
  createDemoPermissions,
  createPermissionStore,
} from './individualPermissionDemoStore.js';

/*
 * FUENTE DE DEMOSTRACIÓN (solo desarrollo). Solo la carga
 * individualPermissionSource.js mediante import() dinámico cuando el modo
 * demo está activo; en producción este módulo no llega al build. Responde
 * con la misma forma que la API. El escenario se fija al primer uso: para
 * cambiarlo, recargar la página.
 */
export const DEMO_DELAY_MS = 400;

let store = null;

function getStore() {
  if (!store) {
    const empty =
      getPermissionDemoScenario() === PERMISSION_DEMO_SCENARIO.EMPTY;
    store = createPermissionStore({
      participants: createDemoPermissions(getCurrentDateInBogota(), { empty }),
    });
  }
  return store;
}

// Solo para pruebas: vuelve a la semilla con el escenario actual.
export function resetPermissionDemoStore() {
  store = null;
}

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

const forced = (status, codigo, mensaje = '') => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

export async function listPermissions(code) {
  const scenario = getPermissionDemoScenario();
  if (scenario === PERMISSION_DEMO_SCENARIO.LOADING)
    return new Promise(() => {});

  await pause();

  if (scenario === PERMISSION_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado del modo de demostración.');
  }
  return getStore().list(code);
}

export async function grantPermission(request) {
  await pause();

  const scenario = getPermissionDemoScenario();
  if (scenario === PERMISSION_DEMO_SCENARIO.CONFLICT) {
    // Con `mensaje`, para ver en la interfaz el texto del backend tal cual.
    return forced(
      409,
      PERMISSION_ERROR.ALREADY_ACTIVE,
      'Mensaje simulado del servidor: ya existe un permiso vigente con este alcance.',
    );
  }
  if (scenario === PERMISSION_DEMO_SCENARIO.SELF_GRANT) {
    return forced(422, PERMISSION_ERROR.SELF_GRANT_FORBIDDEN);
  }
  return getStore().grant(request);
}

export async function revokePermission(permissionId) {
  await pause();

  if (getPermissionDemoScenario() === PERMISSION_DEMO_SCENARIO.REVOKE_ERROR) {
    // Fallo sin respuesta del servidor: el mismo error normalizado que la API.
    throw toApiError(new Error('Network Error'));
  }
  const result = getStore().revoke(permissionId);
  return result.ok ? { ok: true } : result;
}
