import { endOfDayInBogota } from '../services/individualPermission.js';
import {
  PERMISSION_ERROR,
  PERMISSION_SCOPE,
} from '../types/permissionScope.js';
import { addDays } from '../utils/tomorrowInBogota.js';

/*
 * Almacén en memoria de los permisos de demostración. Responde como el
 * backend (PR #87, D22) y en el mismo orden al conceder: autoconcesión
 * (422) → vigencia (422) → participante (404) → rol del beneficiario (422)
 * → mismo beneficiario, participante y alcance sin revocar (409). La lista
 * pagina y solo trae los vigentes; con un código desconocido responde `null`
 * (el backend da 404 `PARTICIPANTE_NO_ENCONTRADO`, D38). Revocar solo rechaza si ya
 * tenía `revocado_en`: un permiso vencido sin revocar se revoca con 200.
 * `now` se inyecta para las pruebas.
 */

// Igual que el `limit` por defecto del DTO del backend (no la constante de la API).
export const PAGE_SIZE_DEFAULT = 20;

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// El coordinador de la sesión de demostración: no puede concederse permisos.
export const DEMO_CURRENT_USER_ID = uuid(1);

// Administrativos con cuenta ACTIVA (los que ofrece el endpoint de beneficiarios). Son 105 para
// que la demostración muestre el aviso de más de 100 (D44).
export const DEMO_ADMINISTRATIVOS = Object.freeze(
  Array.from({ length: 105 }, (_, i) =>
    Object.freeze({
      id_usuario: uuid(100 + i),
      correo_electronico: `admin${String(i + 1).padStart(3, '0')}@brisa.local`,
    }),
  ),
);

// Administrativo con la cuenta no activa: no se ofrece, pero el POST lo acepta (A-079).
export const DEMO_INACTIVE_ADMINISTRATIVO = Object.freeze({
  id_usuario: uuid(300),
  correo_electronico: 'admin.bloqueado@brisa.local',
});

const ALL_ADMINISTRATIVOS = [
  ...DEMO_ADMINISTRATIVOS,
  DEMO_INACTIVE_ADMINISTRATIVO,
];
const emailOf = (id) =>
  ALL_ADMINISTRATIVOS.find((a) => a.id_usuario === id)?.correo_electronico ??
  null;

export const DEMO_PERMISSION_ID = Object.freeze({
  ACTIVE_1: uuid(1001),
  ACTIVE_2: uuid(1002),
  EXPIRED: uuid(1003),
  REVOKED: uuid(1004),
});

const reject = (status, codigo, mensaje = '') => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

const isActive = (record, now) =>
  record.revocado_en === null &&
  Date.parse(record.fecha_inicio_vigencia) <= now.getTime() &&
  (record.fecha_fin_vigencia === null ||
    Date.parse(record.fecha_fin_vigencia) > now.getTime());

// Elemento del GET: el registro con `vigente` y el correo del beneficiario (D36).
const toListItem = (record, now) => ({
  ...record,
  correo_beneficiario: emailOf(record.id_usuario_beneficiario),
  vigente: isActive(record, now),
});

// 201 del POST: sin el beneficiario, su correo ni `revocado_en`.
function toGrantResponse(record, now) {
  const response = toListItem(record, now);
  delete response.id_usuario_beneficiario;
  delete response.correo_beneficiario;
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

  function list(code, { offset = 0, limit = PAGE_SIZE_DEFAULT } = {}) {
    const records = byCode.get(code);
    if (!records) return null;
    const active = records.filter((record) => isActive(record, now()));
    return {
      items: active
        .slice(offset, offset + limit)
        .map((r) => toListItem(r, now())),
      total: active.length,
      offset,
      limit,
    };
  }

  function grant({
    codigo_participante: code,
    alcance,
    fecha_fin_vigencia: endsAt = null,
    id_usuario_beneficiario: beneficiaryId,
  }) {
    if (beneficiaryId === DEMO_CURRENT_USER_ID)
      return reject(422, PERMISSION_ERROR.SELF_GRANT_FORBIDDEN);
    if (endsAt !== null && Date.parse(endsAt) <= now().getTime())
      return reject(422, PERMISSION_ERROR.INVALID_VALIDITY);
    const records = byCode.get(code);
    if (!records) return reject(404, PERMISSION_ERROR.PARTICIPANT_NOT_FOUND);
    if (!ALL_ADMINISTRATIVOS.some((a) => a.id_usuario === beneficiaryId))
      return reject(422, PERMISSION_ERROR.INVALID_ROLE);
    if (
      records.some(
        (record) =>
          record.alcance === alcance &&
          record.id_usuario_beneficiario === beneficiaryId &&
          isActive(record, now()),
      )
    ) {
      return reject(409, PERMISSION_ERROR.ALREADY_ACTIVE);
    }

    sequence += 1;
    const record = {
      id_permiso: uuid(2000 + sequence),
      codigo_participante: code,
      alcance,
      fecha_inicio_vigencia: now().toISOString(),
      fecha_fin_vigencia: endsAt,
      id_usuario_beneficiario: beneficiaryId,
      revocado_en: null,
    };
    // Más nuevo primero, como el backend (`fecha_creacion DESC`): D32.
    records.unshift(record);
    return { ok: true, data: toGrantResponse(record, now()) };
  }

  function revoke(permissionId) {
    const record = allRecords().find(
      ({ id_permiso: id }) => id === permissionId,
    );
    if (!record) return reject(404, PERMISSION_ERROR.NOT_FOUND);
    if (record.revocado_en !== null)
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

  // Solo cuentas activas, por correo ascendente (como el backend).
  function listBeneficiaries({ offset = 0, limit = 100 } = {}) {
    const sorted = [...DEMO_ADMINISTRATIVOS].sort((a, b) =>
      a.correo_electronico.localeCompare(b.correo_electronico),
    );
    return {
      items: sorted.slice(offset, offset + limit),
      total: sorted.length,
      offset,
      limit,
    };
  }

  return { list, grant, revoke, listBeneficiaries };
}

/*
 * Semilla de demostración relativa a `today` (YYYY-MM-DD en Bogotá), para
 * que los permisos vigentes no caduquen con el paso de los días.
 * - P-1A2B3C4D: dos vigentes, uno vencido y uno revocado (estos no se listan);
 * - P-5E6F7A8B: sin permisos;
 * - P-9C0D1E2F: 25 vigentes, para probar la paginación (2 páginas de 20).
 */
export function createDemoPermissions(today, { empty = false } = {}) {
  const startsAt = `${addDays(today, -10)}T14:00:00.000Z`;
  const record = (code, id, alcance, beneficiary, endDate, extra = {}) => ({
    id_permiso: id,
    codigo_participante: code,
    alcance,
    fecha_inicio_vigencia: startsAt,
    fecha_fin_vigencia: endDate === null ? null : endOfDayInBogota(endDate),
    id_usuario_beneficiario: beneficiary,
    revocado_en: null,
    ...extra,
  });
  const main = 'P-1A2B3C4D';
  const { INDIVIDUAL_ACCESS, NARRATIVE_PROGRESSION } = PERMISSION_SCOPE;
  const first = DEMO_ADMINISTRATIVOS[0].id_usuario;
  const second = DEMO_ADMINISTRATIVOS[1].id_usuario;

  return {
    [main]: empty
      ? []
      : [
          record(
            main,
            DEMO_PERMISSION_ID.ACTIVE_1,
            INDIVIDUAL_ACCESS,
            first,
            null,
          ),
          record(
            main,
            DEMO_PERMISSION_ID.ACTIVE_2,
            NARRATIVE_PROGRESSION,
            second,
            addDays(today, 30),
          ),
          // No deben aparecer: vencido ayer y revocado.
          record(
            main,
            DEMO_PERMISSION_ID.EXPIRED,
            INDIVIDUAL_ACCESS,
            second,
            addDays(today, -1),
          ),
          record(
            main,
            DEMO_PERMISSION_ID.REVOKED,
            NARRATIVE_PROGRESSION,
            first,
            null,
            { revocado_en: `${addDays(today, -2)}T14:00:00.000Z` },
          ),
        ],
    'P-5E6F7A8B': [],
    // 13 beneficiarios × 2 alcances, menos uno: 25 combinaciones distintas.
    'P-9C0D1E2F': Array.from({ length: 25 }, (_, i) =>
      record(
        'P-9C0D1E2F',
        uuid(3000 + i),
        i < 13 ? INDIVIDUAL_ACCESS : NARRATIVE_PROGRESSION,
        DEMO_ADMINISTRATIVOS[i % 13].id_usuario,
        null,
      ),
    ),
  };
}
