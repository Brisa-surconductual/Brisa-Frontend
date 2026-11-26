import { ESTADO_INTERVENCION_SOS } from '../../types/sos.js';
import { mapNodoActual } from '../nodoActual.js';

import { duracionServidorMs } from './tiempoSos.js';

/*
 * RF-43: respuestas de /chat/sos → modelo de la interfaz. Solo los campos
 * del contrato. Una respuesta sin los datos imprescindibles devuelve null:
 * no se presenta una intervención a medias.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esUuid = (valor) => typeof valor === 'string' && UUID.test(valor);
const esObjeto = (valor) => valor !== null && typeof valor === 'object';
const textoNoVacio = (valor) =>
  typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;

// Recursos de apoyo tal como llegan (nombre y teléfono). Un elemento sin
// nombre no se puede presentar y se descarta; no se inventan datos.
export function mapRecursosApoyo(recursos) {
  if (!Array.isArray(recursos)) return Object.freeze([]);

  return Object.freeze(
    recursos
      .filter((recurso) => esObjeto(recurso) && textoNoVacio(recurso.nombre))
      .map((recurso) =>
        Object.freeze({
          nombre: textoNoVacio(recurso.nombre),
          telefono: textoNoVacio(recurso.telefono),
        }),
      ),
  );
}

// `nodo_actual` llega en snake_case (como en /iniciar): se lleva al mismo
// modelo de RF-26 que usa la conversación, sin tocar el contenido.
function mapNodoSos(nodo, idSesionSos) {
  return mapNodoActual({
    idSesion: idSesionSos,
    estadoSesion: null,
    nodo: {
      idNodo: nodo.id_nodo,
      tipoNodo: nodo.tipo_nodo,
      orden: nodo.orden ?? null,
      esTerminal: nodo.es_terminal,
      disponibilidad: esObjeto(nodo.disponibilidad)
        ? {
            habilitado: nodo.disponibilidad.habilitado,
            habilitaAprox: nodo.disponibilidad.habilita_aprox ?? null,
          }
        : undefined,
      bloques: nodo.bloques,
      entrada: nodo.entrada,
    },
  }).nodo;
}

export function mapActivacionSos(data) {
  if (!esObjeto(data)) return null;

  const duracionMs = duracionServidorMs(
    data.inicio_servidor,
    data.fin_maximo_servidor,
  );

  if (
    !esUuid(data.id_intervencion) ||
    !esUuid(data.id_sesion_sos) ||
    duracionMs === null ||
    !esObjeto(data.nodo_actual) ||
    typeof data.nodo_actual.id_nodo !== 'string'
  ) {
    return null;
  }

  const pausada = data.sesion_pausada;

  return Object.freeze({
    idIntervencion: data.id_intervencion,
    idSesionSos: data.id_sesion_sos,
    sesionPausada: esUuid(pausada?.id_sesion)
      ? Object.freeze({ idSesion: pausada.id_sesion })
      : null,
    duracionMs,
    nodo: mapNodoSos(data.nodo_actual, data.id_sesion_sos),
    recursos: mapRecursosApoyo(data.recursos_apoyo),
  });
}

export function mapFinalizacionSos(data) {
  if (!esObjeto(data) || typeof data.estado !== 'string') return null;

  const pausada = data.sesion_pausada;

  return Object.freeze({
    estado: data.estado,
    // La duración es la del servidor; si no llega no se calcula aquí.
    duracionSegundos: Number.isInteger(data.duracion_segundos)
      ? data.duracion_segundos
      : null,
    sesionPausada: esUuid(pausada?.id_sesion)
      ? Object.freeze({
          idSesion: pausada.id_sesion,
          idNodoActual:
            typeof pausada.id_nodo_actual === 'string'
              ? pausada.id_nodo_actual
              : null,
        })
      : null,
    // Se valida al usarlo (contextoRetornoSeguro).
    contextoRetorno: esObjeto(data.contexto_retorno)
      ? data.contexto_retorno
      : null,
  });
}

export const esEstadoConocido = (estado) =>
  Object.values(ESTADO_INTERVENCION_SOS).includes(estado);

// RF-43: enlace `tel:` solo para un número marcable (dígitos, con `+`
// inicial opcional, espacios o guiones). «POR_CONFIRMAR» u otro texto se
// muestra sin enlace.
const TELEFONO = /^\+?\d[\d\s-]{0,19}$/;

export function enlaceTelefono(telefono) {
  if (typeof telefono !== 'string') return null;

  const limpio = telefono.trim();

  if (!TELEFONO.test(limpio)) return null;

  return `tel:${limpio.replace(/[\s-]/g, '')}`;
}
