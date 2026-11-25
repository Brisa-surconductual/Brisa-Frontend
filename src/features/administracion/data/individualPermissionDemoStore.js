import { endOfDayInBogota } from '../services/individualPermission.js';
import {
  PERMISSION_ERROR,
  PERMISSION_SCOPE,
} from '../types/permissionScope.js';
import { addDays } from '../utils/tomorrowInBogota.js';

/*
 * Almacén en memoria de los permisos de demostración. Responde con la
 * forma del contrato de Taiga (A-075): la lista solo trae los vigentes,
 * conceder da 404 si el participante no existe y 409 si ya hay uno vigente
 * con el mismo alcance, y revocar da 409 si ya no estaba vigente. La
 * autoconcesión (422) solo la fuerza el escenario `autoconcesion`. `now`
 * se inyecta para las pruebas.
 */

export const DEMO_HOLDER = Object.freeze({
  id: 'demo-admin',
  nombre: 'Administrador de demostración',
});

const reject = (status, codigo, mensaje = '') => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

const isActive = (record, now) =>
  record.revocado_en === null &&
  (record.fecha_fin_vigencia === null ||
    Date.parse(record.fecha_fin_vigencia) > now.getTime());

// Lo que viaja por la API: `vigente` calculado y sin `revocado_en`.
function toResponse(record, now) {
  const response = { ...record, vigente: isActive(record, now) };
  delete response.revocado_en;
  return response;
}

export function createPermissionStore({
  participants,
  now = () => new Date(),
}) {
  const byCode = new Map(
    Object.entries(participants).map(([code, records]) => [
      code,
      records.map((r) => ({ ...r })),
    ]),
  );
  let sequence = 0;

  const allRecords = () => [...byCode.values()].flat();

  function list(code) {
    const records = byCode.get(code);
    if (!records) return null;
    return records
      .filter((record) => isActive(record, now()))
      .map((r) => toResponse(r, now()));
  }

  function grant({
    codigo_participante: code,
    alcance,
    fecha_fin_vigencia: endsAt = null,
  }) {
    const records = byCode.get(code);
    if (!records) return reject(404, PERMISSION_ERROR.PARTICIPANT_NOT_FOUND);
    if (
      records.some(
        (record) => record.alcance === alcance && isActive(record, now()),
      )
    ) {
      return reject(409, PERMISSION_ERROR.ALREADY_ACTIVE);
    }

    sequence += 1;
    const record = {
      id_permiso: `demo-permiso-nuevo-${sequence}`,
      alcance,
      fecha_inicio_vigencia: now().toISOString(),
      fecha_fin_vigencia: endsAt,
      titular: DEMO_HOLDER,
      revocado_en: null,
    };
    records.push(record);
    return {
      ok: true,
      data: { ...toResponse(record, now()), codigo_participante: code },
    };
  }

  function revoke(permissionId) {
    const record = allRecords().find(
      ({ id_permiso: id }) => id === permissionId,
    );
    if (!record) throw new Error('Permiso de demostración inexistente.');
    if (!isActive(record, now()))
      return reject(409, PERMISSION_ERROR.ALREADY_REVOKED);
    record.revocado_en = now().toISOString();
    return {
      ok: true,
      data: {
        id_permiso: permissionId,
        vigente: false,
        revocado_en: record.revocado_en,
      },
    };
  }

  return { list, grant, revoke };
}

/*
 * Semilla de demostración relativa a `today` (YYYY-MM-DD en Bogotá), para
 * que los permisos vigentes no caduquen con el paso de los días. Uno trae
 * titular y otro no (es opcional en el contrato).
 */
export function createDemoPermissions(today, { empty = false } = {}) {
  const startsAt = `${addDays(today, -10)}T14:00:00.000Z`;
  const record = (id, alcance, endDate, extra = {}) => ({
    id_permiso: id,
    alcance,
    fecha_inicio_vigencia: startsAt,
    fecha_fin_vigencia: endDate === null ? null : endOfDayInBogota(endDate),
    revocado_en: null,
    ...extra,
  });

  return {
    'P-1A2B3C4D': empty
      ? []
      : [
          record('demo-permiso-1', PERMISSION_SCOPE.INDIVIDUAL_ACCESS, null, {
            titular: DEMO_HOLDER,
          }),
          record(
            'demo-permiso-2',
            PERMISSION_SCOPE.NARRATIVE_PROGRESSION,
            addDays(today, 30),
          ),
          // No deben aparecer: vencido ayer y revocado.
          record(
            'demo-permiso-vencido',
            PERMISSION_SCOPE.INDIVIDUAL_ACCESS,
            addDays(today, -1),
          ),
          record(
            'demo-permiso-revocado',
            PERMISSION_SCOPE.NARRATIVE_PROGRESSION,
            null,
            {
              revocado_en: `${addDays(today, -2)}T14:00:00.000Z`,
            },
          ),
        ],
    'P-5E6F7A8B': [],
  };
}
