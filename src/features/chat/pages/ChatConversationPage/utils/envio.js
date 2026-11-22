import { TIPO_ENTRADA } from '../../../types/index.js';
import { capturadaEn as capturadaEnAhora } from '../../../utils/capturadaEn.js';
import { nuevoUuid } from '../../../utils/nuevoUuid.js';

// Tabla 2.5 del brief: qué hace la página con cada error del envío. El
// texto siempre es el `mensaje` del backend (ADR-0004).
export const ACCION_ERROR_ENVIO = Object.freeze({
  INLINE: 'INLINE',
  DESACTUALIZADO: 'DESACTUALIZADO',
  LOGIN: 'LOGIN',
  REINTENTAR: 'REINTENTAR',
  VOLVER_AL_CHAT: 'VOLVER_AL_CHAT',
  VOLVER_AL_INICIO: 'VOLVER_AL_INICIO',
});

const CODIGO = Object.freeze({
  TIPO_ENTRADA_NO_PERMITIDO: 'TIPO_ENTRADA_NO_PERMITIDO',
  SESION_NO_ENCONTRADA: 'SESION_NO_ENCONTRADA',
});

// RF-30 y RF-32: el estado local ya no coincide con el del servidor. Se
// descarta la respuesta y se vuelven a pedir el nodo actual y el
// historial, que traen la secuencia y la posición vigentes.
const CODIGOS_RESINCRONIZAR = Object.freeze([
  'NODO_DESACTUALIZADO',
  'SECUENCIA_FUERA_DE_ORDEN',
  'NODO_TERMINAL',
  'SESION_NO_ACTIVA',
  // RF-24/RF-22: el nodo aún no se habilita; al recargar se muestra la espera.
  'NODO_EN_ESPERA_CRONOGRAMA',
]);

// Contrato vigente del POST (RF-30): sin operación sin conexión (ADR-0005).
const ESTADO_CONECTIVIDAD_EN_LINEA = 'EN_LINEA';

export function clasificarErrorEnvio(error) {
  const status = error?.status ?? null;
  const codigo = error?.codigo;

  // El 401 llega sin `codigo`: se decide por estado HTTP.
  if (status === 401) return ACCION_ERROR_ENVIO.LOGIN;
  if (CODIGOS_RESINCRONIZAR.includes(codigo)) {
    return ACCION_ERROR_ENVIO.DESACTUALIZADO;
  }
  // Todo 400 es de validación salvo TIPO_ENTRADA_NO_PERMITIDO (desajuste de
  // A-014): así un código nuevo del backend no bloquea la pantalla.
  if (status === 400 && codigo !== CODIGO.TIPO_ENTRADA_NO_PERMITIDO) {
    return ACCION_ERROR_ENVIO.INLINE;
  }
  // Sin respuesta o 5xx (incluidos SIN_TRANSICION, DESTINO_INVALIDO y
  // ERROR_PERFIL): se reintenta con el mismo idRespuesta (D7).
  if (error?.reintentable === true) return ACCION_ERROR_ENVIO.REINTENTAR;
  if (status === 403 || codigo === CODIGO.SESION_NO_ENCONTRADA) {
    return ACCION_ERROR_ENVIO.VOLVER_AL_CHAT;
  }

  return ACCION_ERROR_ENVIO.VOLVER_AL_INICIO;
}

export const esNodoInformativo = (nodo) =>
  !nodo.entrada || nodo.entrada.tipo === TIPO_ENTRADA.CONTINUAR;

// D19: el generador vive en utils/nuevoUuid.js (lo comparte la cola sin
// conexión). El comportamiento del envío en línea no cambia.
export const nuevoIdRespuesta = nuevoUuid;

// D6 y D7: cada respuesta distinta lleva un id_interaccion nuevo; el
// reintento reusa este mismo objeto (mismo id, misma secuencia y misma
// hora). CA-27-6: el nodo informativo envía CONTINUAR con valor null.
// RF-30: `secuencia` es la última conocida + 1; los recursos que no se
// pudieron mostrar viajan en `recursos_no_presentados` (null si ninguno).
export function crearCuerpo(
  nodo,
  valor,
  {
    secuencia,
    recursosNoPresentados = [],
    idInteraccion = nuevoIdRespuesta(),
    timestamp = capturadaEnAhora(),
  } = {},
) {
  const informativo = esNodoInformativo(nodo);

  return Object.freeze({
    id_interaccion: idInteraccion,
    id_nodo: nodo.idNodo,
    secuencia,
    tipo_entrada: informativo ? TIPO_ENTRADA.CONTINUAR : nodo.entrada.tipo,
    valor: informativo ? null : valor,
    timestamp_interaccion: timestamp,
    estado_conectividad: ESTADO_CONECTIVIDAD_EN_LINEA,
    recursos_no_presentados:
      recursosNoPresentados.length > 0 ? [...recursosNoPresentados] : null,
  });
}
