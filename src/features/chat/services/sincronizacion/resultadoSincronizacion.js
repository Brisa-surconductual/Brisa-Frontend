import { RESULTADO_SINCRONIZACION } from '../../types/index.js';

const { SINCRONIZADA, DUPLICADA, RECHAZADA, PENDIENTE } =
  RESULTADO_SINCRONIZACION;

const noVerificable = (motivo) => ({ valido: false, motivo });

const esObjeto = (valor) => valor !== null && typeof valor === 'object';
const textoOpcional = (valor) =>
  valor === null || valor === undefined || typeof valor === 'string';

function resumenCoincide(resumen, cuenta) {
  if (resumen === undefined || resumen === null) return true;
  if (!esObjeto(resumen)) return false;

  return (
    resumen.total === cuenta.total &&
    resumen.sincronizadas === cuenta.sincronizadas &&
    resumen.duplicadas === cuenta.duplicadas &&
    resumen.rechazadas === cuenta.rechazadas &&
    resumen.pendientes === cuenta.pendientes
  );
}

/*
 * Interpreta `data` de una respuesta 200 contra el lote enviado. La
 * confirmación es individual: solo se confirma lo que el servidor nombra
 * con su `id_interaccion` y su `secuencia`.
 *
 * Si algo no se puede verificar (un id ajeno o repetido, otra secuencia,
 * un resultado desconocido, una confirmación después de una interacción
 * detenida, un resumen que no cuadra), la respuesta entera se descarta y
 * no se borra nada. Una interacción del lote sin resultado queda
 * pendiente.
 */
export function interpretarResultados(lote, data) {
  if (!esObjeto(data) || !Array.isArray(data.resultados)) {
    return noVerificable('SIN_RESULTADOS');
  }
  if (!textoOpcional(data.id_nodo_actual)) {
    return noVerificable('NODO_INVALIDO');
  }

  const delLote = new Map(lote.map((i) => [i.id_interaccion, i]));
  const porId = new Map();

  for (const r of data.resultados) {
    const item = delLote.get(r?.id_interaccion);

    if (!item || porId.has(r.id_interaccion)) {
      return noVerificable('ID_DESCONOCIDO_O_REPETIDO');
    }
    if (r.secuencia !== item.secuencia) {
      return noVerificable('SECUENCIA_DISTINTA');
    }
    porId.set(r.id_interaccion, r);
  }

  const confirmadas = [];
  const rechazadas = [];
  const pendientes = [];
  const cuenta = {
    total: data.resultados.length,
    sincronizadas: 0,
    duplicadas: 0,
    rechazadas: 0,
    pendientes: 0,
  };
  // El servidor procesa en orden y se detiene en la primera rechazada:
  // nada se puede confirmar después de una interacción no confirmada.
  let detenido = false;

  for (const item of lote) {
    const r = porId.get(item.id_interaccion);
    const id = item.id_interaccion;

    if (!r) {
      detenido = true;
      pendientes.push(id);
      continue;
    }

    switch (r.resultado) {
      case SINCRONIZADA:
      case DUPLICADA:
        if (detenido) return noVerificable('CONFIRMADA_TRAS_DETENCION');
        confirmadas.push(id);
        cuenta[r.resultado === SINCRONIZADA ? 'sincronizadas' : 'duplicadas'] +=
          1;
        break;
      case RECHAZADA:
        if (detenido || typeof r.codigo !== 'string' || !r.codigo) {
          return noVerificable('RECHAZO_INVALIDO');
        }
        if (!textoOpcional(r.mensaje)) return noVerificable('RECHAZO_INVALIDO');
        detenido = true;
        rechazadas.push({
          id_interaccion: id,
          codigo: r.codigo,
          mensaje: r.mensaje ?? null,
        });
        cuenta.rechazadas += 1;
        break;
      case PENDIENTE:
        detenido = true;
        pendientes.push(id);
        cuenta.pendientes += 1;
        break;
      default:
        return noVerificable('RESULTADO_DESCONOCIDO');
    }
  }

  if (!resumenCoincide(data.resumen, cuenta)) {
    return noVerificable('RESUMEN_NO_COINCIDE');
  }

  return {
    valido: true,
    confirmadas,
    rechazadas,
    pendientes,
    idNodoActual: data.id_nodo_actual ?? null,
    estadoSesion: data.estado_sesion ?? null,
  };
}
