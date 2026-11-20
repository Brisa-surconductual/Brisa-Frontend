import { BLOQUEO_OFFLINE } from '../../types/operacionOffline.js';
import { TIPO_ENTRADA } from '../../types/index.js';

import {
  aNodoInterfaz,
  buscarNodoPaquete,
  esInformativo,
} from './nodoPaquete.js';
import {
  RESULTADO_TRANSICION,
  elegirTransicionLocal,
} from './transicionLocal.js';
import {
  RESULTADO_VALIDACION,
  validarRespuestaLocal,
} from './validacionLocal.js';

/*
 * Motor de la conversación sin conexión (RF-34). Decide, sin tocar la
 * base, qué pasa con una respuesta al nodo actual:
 * - INVALIDA: no pasa la validación local; se muestra el mensaje y no
 *   se guarda nada.
 * - BLOQUEO: no se puede continuar sin conexión (paquete o nodo ausente,
 *   regla no soportada o sin transición); no se guarda nada.
 * - AVANZAR: respuesta válida con destino presente en el paquete. Solo
 *   entonces quien llama la encola (encolarInteraccion) y, si la
 *   escritura termina bien, muestra el destino.
 */
export const DECISION_OFFLINE = Object.freeze({
  AVANZAR: 'AVANZAR',
  INVALIDA: 'INVALIDA',
  BLOQUEO: 'BLOQUEO',
});

const bloqueo = (codigo, motivo) =>
  Object.freeze({ tipo: DECISION_OFFLINE.BLOQUEO, codigo, motivo });

export function decidirRespuestaOffline(paquete, idNodoActual, valor) {
  if (!paquete) return bloqueo(BLOQUEO_OFFLINE.SIN_PAQUETE);

  const nodoPaquete = buscarNodoPaquete(paquete, idNodoActual);
  if (!nodoPaquete) return bloqueo(BLOQUEO_OFFLINE.NODO_AUSENTE);

  const { nodo } = aNodoInterfaz(nodoPaquete);
  const informativo = esInformativo(nodo);
  // CA-27-6: el nodo informativo responde CONTINUAR con valor null.
  const respuesta = informativo ? null : valor;

  const validacion = validarRespuestaLocal(
    { validacion: nodoPaquete.validacion, informativo },
    respuesta,
  );

  if (validacion.resultado === RESULTADO_VALIDACION.NO_SOPORTADA) {
    return bloqueo(BLOQUEO_OFFLINE.REGLA_NO_SOPORTADA, validacion.motivo);
  }
  if (validacion.resultado === RESULTADO_VALIDACION.INVALIDA) {
    return Object.freeze({
      tipo: DECISION_OFFLINE.INVALIDA,
      error: Object.freeze({
        codigo: validacion.codigo,
        mensaje: validacion.mensaje,
      }),
    });
  }

  const transicion = elegirTransicionLocal(nodoPaquete.transiciones, respuesta);

  if (transicion.resultado === RESULTADO_TRANSICION.NO_SOPORTADA) {
    return bloqueo(BLOQUEO_OFFLINE.REGLA_NO_SOPORTADA, transicion.motivo);
  }
  if (transicion.resultado === RESULTADO_TRANSICION.SIN_TRANSICION) {
    return bloqueo(BLOQUEO_OFFLINE.SIN_TRANSICION);
  }

  const destino = buscarNodoPaquete(paquete, transicion.idNodoDestino);
  if (!destino) return bloqueo(BLOQUEO_OFFLINE.NODO_AUSENTE);

  return Object.freeze({
    tipo: DECISION_OFFLINE.AVANZAR,
    tipoEntrada: informativo ? TIPO_ENTRADA.CONTINUAR : nodo.entrada.tipo,
    valor: respuesta,
    idNodoDestino: destino.id_nodo,
    // El destino terminal completa la sesión (D8 y A-016).
    destinoTerminal: destino.es_terminal === true,
  });
}
