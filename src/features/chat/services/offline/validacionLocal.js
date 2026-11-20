import { TIPO_DATO_OFFLINE } from '../../types/operacionOffline.js';

/*
 * RF-28 sin conexión: valida la respuesta con la `validacion` del nodo
 * del paquete (contrato 5a). Solo se aplica lo que el contrato de la
 * Etapa 3 define de forma explícita: tipo ENTERO con `obligatorio`,
 * `valor_min` y `valor_max`. Cualquier otra regla (otro tipo de dato,
 * `formato_regex`, `valores_permitidos`) es NO_SOPORTADA: la respuesta
 * no se acepta en silencio.
 *
 * No replica el backend: allí la validación va por transición y usa
 * otros tipos de dato (bloqueante documentado).
 */
export const RESULTADO_VALIDACION = Object.freeze({
  VALIDA: 'VALIDA',
  INVALIDA: 'INVALIDA',
  NO_SOPORTADA: 'NO_SOPORTADA',
});

const { VALIDA, INVALIDA, NO_SOPORTADA } = RESULTADO_VALIDACION;

const MENSAJE_GENERICO = 'La respuesta no es válida.';

const esVacia = (valor) =>
  valor == null ||
  (typeof valor === 'string' && valor.trim() === '') ||
  (Array.isArray(valor) && valor.length === 0);

const limiteValido = (limite) =>
  limite === null || limite === undefined || Number.isFinite(limite);

const noSoportada = (motivo) =>
  Object.freeze({ resultado: NO_SOPORTADA, motivo });

function invalida(validacion, codigo) {
  const mensaje =
    typeof validacion.mensaje_error === 'string' &&
    validacion.mensaje_error.trim() !== ''
      ? validacion.mensaje_error
      : MENSAJE_GENERICO;

  return Object.freeze({ resultado: INVALIDA, codigo, mensaje });
}

// `informativo`: el nodo no pide dato (sin entrada o CONTINUAR).
export function validarRespuestaLocal({ validacion, informativo }, valor) {
  if (validacion === null || validacion === undefined) {
    // Un nodo informativo no tiene nada que validar; uno con entrada sin
    // reglas no se puede validar en el dispositivo.
    return informativo
      ? Object.freeze({ resultado: VALIDA })
      : noSoportada('SIN_VALIDACION');
  }

  if (typeof validacion !== 'object')
    return noSoportada('VALIDACION_MALFORMADA');
  if (validacion.tipo_dato !== TIPO_DATO_OFFLINE.ENTERO)
    return noSoportada('TIPO_DATO');
  if (validacion.formato_regex != null) return noSoportada('FORMATO_REGEX');
  if (validacion.valores_permitidos != null)
    return noSoportada('VALORES_PERMITIDOS');
  if (typeof validacion.obligatorio !== 'boolean')
    return noSoportada('OBLIGATORIO');
  if (
    !limiteValido(validacion.valor_min) ||
    !limiteValido(validacion.valor_max)
  ) {
    return noSoportada('LIMITES');
  }

  if (esVacia(valor)) {
    return validacion.obligatorio
      ? invalida(validacion, 'RESPUESTA_OBLIGATORIA')
      : Object.freeze({ resultado: VALIDA });
  }

  if (!Number.isInteger(valor))
    return invalida(validacion, 'TIPO_DATO_INVALIDO');

  const { valor_min: min, valor_max: max } = validacion;

  if (
    (Number.isFinite(min) && valor < min) ||
    (Number.isFinite(max) && valor > max)
  ) {
    return invalida(validacion, 'FUERA_DE_RANGO');
  }

  return Object.freeze({ resultado: VALIDA });
}
