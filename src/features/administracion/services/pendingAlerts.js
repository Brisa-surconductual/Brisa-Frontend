import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import {
  ATTEND_OUTCOME,
  ATTEND_REASON_MAX,
  ATTEND_REASON_MIN,
  PENDING_ALERTS_STATUS as S,
} from '../types/pendingAlerts.js';

/*
 * RF-146 / RF-147: reglas puras de la bandeja. Los errores se deciden por
 * estado HTTP y `codigo`, nunca por el texto (ADR-0004); el `mensaje` del
 * backend se muestra tal cual cuando llega.
 */
const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isCount = (value) => Number.isInteger(value) && value >= 0;

export class InvalidPendingAlertsResponse extends Error {
  constructor() {
    super('La respuesta de alertas pendientes no tiene el formato esperado.');
    this.name = 'InvalidPendingAlertsResponse';
  }
}

/*
 * Cuerpo 200 → modelo de la interfaz. Solo los campos de la lista blanca
 * del contrato; se conserva el orden del servidor (la más antigua primero).
 * Cualquier elemento incompleto invalida la página: no se muestra una
 * bandeja a medias.
 */
export function interpretPendingAlerts(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.items) ||
    !isCount(data.total) ||
    !isCount(data.offset) ||
    !Number.isInteger(data.limit) ||
    data.limit < 1
  ) {
    throw new InvalidPendingAlertsResponse();
  }

  const items = data.items.map((item) => {
    if (
      !item ||
      !isText(item.id_alerta) ||
      !isText(item.tipo_alerta) ||
      !isText(item.fecha_generacion) ||
      !isText(item.codigo_participante)
    ) {
      throw new InvalidPendingAlertsResponse();
    }

    return Object.freeze({
      id: item.id_alerta,
      type: item.tipo_alerta,
      generatedAt: item.fecha_generacion,
      participantCode: item.codigo_participante,
    });
  });

  return Object.freeze({
    items: Object.freeze(items),
    total: data.total,
    offset: data.offset,
    limit: data.limit,
  });
}

// Offset de la última página que existe para `total` elementos.
export function lastPageOffset(total, limit) {
  if (!isCount(total) || total === 0) return 0;

  return Math.floor((total - 1) / limit) * limit;
}

// Página vacía con elementos en otras páginas (200, items: [], total > 0).
export const isOutOfRange = (page) => page.items.length === 0 && page.total > 0;

export function pageInfo(page) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.limit));
  const pageNumber = Math.min(pageCount, Math.floor(page.offset / page.limit) + 1);

  return Object.freeze({
    range: Object.freeze({ from: page.offset + 1, to: page.offset + page.items.length }),
    pageNumber,
    pageCount,
    canGoBack: page.offset > 0,
    canGoForward: page.offset + page.limit < page.total,
  });
}

const message = (error) => (isText(error?.mensaje) ? error.mensaje : '');

/*
 * Situación de un error del GET ya normalizado por `toApiError`. Reintentar
 * solo sin respuesta, 5xx o respuesta inválida, siempre por acción del
 * usuario (ADR-0004, D3).
 */
export function classifyPendingAlertsError(error) {
  const result = (status, canRetry = false) =>
    Object.freeze({ status, message: message(error), canRetry });

  if (error instanceof InvalidPendingAlertsResponse) {
    return Object.freeze({ status: S.INVALID_RESPONSE, message: '', canRetry: true });
  }
  if (error?.codigo === API_ERROR_CLIENTE.SIN_CONEXION) return result(S.CONNECTION_ERROR, true);

  const status = error?.status;

  if (status === 400) return result(S.INVALID_REQUEST);
  if (status === 401) return result(S.UNAUTHENTICATED);
  if (status === 403) return result(S.DENIED);
  if (status === 404) return result(S.COHORT_NOT_FOUND);
  if (status === 503) return result(S.SOURCE_UNAVAILABLE, true);

  return result(S.SERVER_ERROR, true);
}

/*
 * Motivo de la atención: obligatorio, de 10 a 500 caracteres tras recortar
 * los espacios (la misma regla del backend). Devuelve el texto recortado
 * que se enviará y, si no es válido, el error para el campo.
 */
export function validateAttendReason(text) {
  const value = typeof text === 'string' ? text.trim() : '';

  if (value.length === 0) return Object.freeze({ value, error: 'Escribe el motivo de la atención.' });
  if (value.length < ATTEND_REASON_MIN) {
    return Object.freeze({
      value,
      error: `El motivo debe tener al menos ${ATTEND_REASON_MIN} caracteres.`,
    });
  }
  if (value.length > ATTEND_REASON_MAX) {
    return Object.freeze({
      value,
      error: `El motivo no puede superar los ${ATTEND_REASON_MAX} caracteres.`,
    });
  }

  return Object.freeze({ value, error: '' });
}

// Respaldos propios cuando el backend no envía `mensaje` (ADR-0004, D2).
const ATTEND_FALLBACK = Object.freeze({
  [ATTEND_OUTCOME.ALREADY_ATTENDED]: 'La alerta ya estaba registrada como atendida.',
  [ATTEND_OUTCOME.NOT_FOUND]: 'La alerta ya no está disponible.',
  [ATTEND_OUTCOME.NOT_ACTIVE]: 'La alerta no admite esta acción.',
  [ATTEND_OUTCOME.INVALID_REASON]: `El motivo debe tener entre ${ATTEND_REASON_MIN} y ${ATTEND_REASON_MAX} caracteres.`,
  [ATTEND_OUTCOME.SOURCE_UNAVAILABLE]:
    'El módulo de seguimiento no está disponible en este momento. La alerta no cambió.',
  [ATTEND_OUTCOME.UNCONFIRMED]:
    'No pudimos confirmar el registro de la atención. Actualiza las alertas antes de intentarlo de nuevo.',
  [ATTEND_OUTCOME.DENIED]: 'No tienes permisos para atender alertas.',
  [ATTEND_OUTCOME.UNAUTHENTICATED]: 'Tu sesión terminó. Inicia sesión de nuevo.',
});

/*
 * Qué hace la bandeja con el resultado del POST.
 * - `keepDialog`: el diálogo sigue abierto con el motivo escrito.
 * - `refresh`: se vuelve a consultar la bandeja.
 * - `requiresRefresh`: el estado de la alerta no se conoce; no se puede
 *   volver a intentar hasta actualizar la bandeja.
 */
export function classifyAttendError(error) {
  const status = error?.status;
  const codigo = error?.codigo;
  const make = (outcome, { keepDialog = false, refresh = false, requiresRefresh = false } = {}) =>
    Object.freeze({
      outcome,
      message: message(error) || ATTEND_FALLBACK[outcome],
      keepDialog,
      refresh,
      requiresRefresh,
    });

  // Sin respuesta: el servidor pudo haber registrado la atención o no.
  if (codigo === API_ERROR_CLIENTE.SIN_CONEXION) {
    return Object.freeze({
      ...make(ATTEND_OUTCOME.UNCONFIRMED, { requiresRefresh: true }),
      message:
        'No hubo respuesta del servidor y no sabemos si la atención quedó registrada. Actualiza las alertas antes de intentarlo de nuevo.',
    });
  }

  if (status === 409 && codigo === 'ALERTA_YA_ATENDIDA') return make(ATTEND_OUTCOME.ALREADY_ATTENDED, { refresh: true });
  if (status === 409 && codigo === 'ALERTA_NO_ACTIVA') return make(ATTEND_OUTCOME.NOT_ACTIVE, { refresh: true });
  if (status === 404) return make(ATTEND_OUTCOME.NOT_FOUND, { refresh: true });
  // 422 del dominio o 400 de la validación del cuerpo: el motivo se corrige.
  if (status === 422 || status === 400) return make(ATTEND_OUTCOME.INVALID_REASON, { keepDialog: true });
  if (status === 503) return make(ATTEND_OUTCOME.SOURCE_UNAVAILABLE, { keepDialog: true });
  if (status === 401) return make(ATTEND_OUTCOME.UNAUTHENTICATED);
  if (status === 403) return make(ATTEND_OUTCOME.DENIED);

  // 500 ERROR_TRANSACCION y cualquier otro: sin éxito ficticio.
  return make(ATTEND_OUTCOME.UNCONFIRMED, { requiresRefresh: true });
}
