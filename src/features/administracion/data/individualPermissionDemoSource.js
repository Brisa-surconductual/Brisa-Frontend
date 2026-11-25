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

const S = PERMISSION_DEMO_SCENARIO;
const E = PERMISSION_ERROR;

// Rechazos forzados por escenario: [status, codigo, mensaje del servidor].
// Con `mensaje` se ve en la interfaz el texto del backend tal cual.
const FORCED_GRANT = {
  [S.CONFLICT]: [
    409,
    E.ALREADY_ACTIVE,
    'Mensaje simulado del servidor: ya existe un permiso vigente con este alcance.',
  ],
  [S.SELF_GRANT]: [422, E.SELF_GRANT_FORBIDDEN, ''],
  [S.INVALID_ROLE]: [
    422,
    E.INVALID_ROLE,
    'Mensaje simulado del servidor: el usuario no tiene un rol válido.',
  ],
  [S.INVALID_VALIDITY]: [422, E.INVALID_VALIDITY, ''],
};

const FORCED_REVOKE = {
  [S.REVOKE_REVOKED]: [409, E.ALREADY_REVOKED, ''],
  [S.REVOKE_MISSING]: [404, E.NOT_FOUND, ''],
};

const forced = ([status, codigo, mensaje]) => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

export async function listPermissions(code, page) {
  const scenario = getPermissionDemoScenario();
  if (scenario === PERMISSION_DEMO_SCENARIO.LOADING)
    return new Promise(() => {});

  await pause();

  if (scenario === PERMISSION_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado del modo de demostración.');
  }
  return getStore().list(code, page);
}

export async function grantPermission(request) {
  await pause();

  const rejection = FORCED_GRANT[getPermissionDemoScenario()];
  return rejection ? forced(rejection) : getStore().grant(request);
}

export async function revokePermission(permissionId) {
  await pause();

  const scenario = getPermissionDemoScenario();
  if (FORCED_REVOKE[scenario]) return forced(FORCED_REVOKE[scenario]);
  if (scenario === PERMISSION_DEMO_SCENARIO.REVOKE_ERROR) {
    // Fallo sin respuesta del servidor: el mismo error normalizado que la API.
    throw toApiError(new Error('Network Error'));
  }
  const result = getStore().revoke(permissionId);
  return result.ok ? { ok: true } : result;
}
