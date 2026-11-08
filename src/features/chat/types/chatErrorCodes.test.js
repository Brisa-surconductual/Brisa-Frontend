import { describe, expect, it } from 'vitest';

import { CATEGORIA_ERROR_CHAT, CHAT_ERROR_CODE } from './chatErrorCodes.js';

// Lista a mano de los `codigo` que maneja el frontend. Si el backend agrega
// o quita uno, esta lista se actualiza a propósito.
const CODIGOS_DEL_CONTRATO = [
  'NO_AUTENTICADO',
  'FLUJO_NO_DISPONIBLE',
  'MODALIDAD_NO_CONFIGURADA',
  'PERFIL_CLINICO_INCOMPLETO',
  'ARBOL_PERSONALIZADO_NO_CONFIGURADO',
  'ARBOL_PERSONALIZADO_NO_PUBLICADO',
  'SIN_UNIDAD_TEMPORAL_VIGENTE',
  'ESTADO_CONVERSACIONAL_INCONSISTENTE',
  'PERFIL_CLINICO_NO_DISPONIBLE',
  'ARBOL_NO_DISPONIBLE',
  'SESION_NO_ENCONTRADA',
  'NODO_NO_ENCONTRADO',
  'CONTENIDO_NODO_NO_DISPONIBLE',
  'SESION_ERROR_CONFIGURACION',
  'RESPUESTA_OBLIGATORIA',
  'TIPO_DATO_INVALIDO',
  'FORMATO_INVALIDO',
  'FUERA_DE_RANGO',
  'OPCION_NO_VALIDA',
  'TIPO_ENTRADA_NO_CORRESPONDE',
  'NODO_SIN_ENTRADA',
  'NODO_NO_ES_ACTUAL',
  'INTERACCION_DUPLICADA',
  'INTERACCION_INCOMPLETA',
  'NODO_DESTINO_INVALIDO',
  'TRANSICION_NO_DETERMINADA',
  'INTERACCION_NO_ALMACENADA',
  'PERFIL_CLINICO_NO_ALMACENADO',
  'SESION_NO_INICIALIZADA',
  'UNIDAD_TEMPORAL_NO_DETERMINADA',
  'ARBOL_NO_DISPONIBLE_PRECARGA',
  'SINCRONIZACION_INTERRUMPIDA',
  'SINCRONIZACION_FALLIDA',
  // Los que el backend emite hoy en POST /chat/sesiones/iniciar
  'SIN_CRONOGRAMA',
  'PERFIL_INCOMPLETO',
  'SIN_FLUJO_PUBLICADO',
  'FLUJO_NO_PUBLICADO',
  'NODO_INICIAL_NO_DISPONIBLE',
  'ERROR_CARGA_ARBOL',
  'NODO_ACTUAL_NO_DISPONIBLE',
  'NODO_FUERA_DE_FLUJO',
  // Etapa 2: POST /chat/sesiones/:id/respuestas
  'FORMATO_INCORRECTO',
  'VALOR_NO_PERMITIDO',
  'TIPO_ENTRADA_NO_PERMITIDO',
  'NODO_TERMINAL',
  'NODO_DESACTUALIZADO',
  'SESION_NO_ACTIVA',
  'CAPTURA_FUERA_DE_GRUPAL',
  'SIN_TRANSICION',
  'DESTINO_INVALIDO',
  'ERROR_PERFIL',
];

const entradas = Object.entries(CHAT_ERROR_CODE);

describe('CHAT_ERROR_CODE', () => {
  it('tiene exactamente los códigos que maneja el frontend', () => {
    expect(Object.keys(CHAT_ERROR_CODE).sort()).toEqual(
      [...CODIGOS_DEL_CONTRATO].sort(),
    );
  });

  it.each(entradas)('%s tiene la forma esperada', (_codigo, detalle) => {
    expect(Number.isInteger(detalle.httpStatus)).toBe(true);
    expect(Object.values(CATEGORIA_ERROR_CHAT)).toContain(detalle.categoria);
    expect(typeof detalle.reintentable).toBe('boolean');
  });

  it.each(entradas)('%s es reintentable solo si es 5xx', (_codigo, d) => {
    expect(d.reintentable).toBe(d.httpStatus >= 500);
  });

  it('INTERACCION_DUPLICADA se trata como éxito', () => {
    expect(CHAT_ERROR_CODE.INTERACCION_DUPLICADA.tratarComoExito).toBe(true);
  });
});
