import { describe, expect, it } from 'vitest';

import {
  PROGRESS_LEVELS,
  SORT_DIRECTION,
  TRACKING_ALERT_FILTER,
  TRACKING_SORT_FIELD,
  TRACKING_THRESHOLDS,
} from '../types/participantTracking.js';

import { TRACKING_SEARCH_PARAM, normalizeTrackingQuery, parseTrackingSearch, toTrackingParams, toTrackingSearch } from './trackingQuery.js';
import { interpretTrackingResponse } from './trackingResponse.js';

/*
 * Contrato de proyección del listado RF-142 en el frontend. Fija, como
 * listas cerradas, los parámetros que el frontend puede enviar, los de su
 * URL y los campos que expone cada registro. Cualquier cambio en esas
 * listas hace fallar esta prueba y obliga a revisarlo contra el contrato.
 * No repite las pruebas del backend: el saneamiento de parámetros
 * restringidos y su auditoría (INTENTO_EXTRACCION_RESTRINGIDA, ALTA) se
 * prueban allí; aquí se comprueba que el frontend nunca los construye.
 */
const ALLOWED_REQUEST_PARAMS = Object.freeze([
  'nivel_progreso',
  'adherencia_min',
  'adherencia_max',
  'con_alertas',
  'orden_campo',
  'orden_direccion',
  'offset',
  'limit',
]);

const ALLOWED_URL_PARAMS = Object.freeze(['nivel', 'adherencia_min', 'adherencia_max', 'alertas', 'orden', 'direccion', 'pagina']);

const EXPOSED_ENTRY_FIELDS = Object.freeze([
  'code',
  'progressLevel',
  'adherence',
  'activeAlertCount',
  'attendedAlertCount',
  'activeAlertTypes',
]);

// Mismo criterio de nombres restringidos que aplica el backend (RF-142 FA3).
const RESTRICTED = /texto|diario|chat|mensaje|correo|email|contenido|transcrip/iu;

// Todas las consultas que pueden construir los controles.
function* everyQuery() {
  const sorts = [null];
  for (const field of Object.values(TRACKING_SORT_FIELD)) {
    for (const direction of Object.values(SORT_DIRECTION)) sorts.push({ field, direction });
  }

  for (const level of [null, ...PROGRESS_LEVELS]) {
    for (const adherenceMin of [null, ...TRACKING_THRESHOLDS]) {
      for (const adherenceMax of [null, ...TRACKING_THRESHOLDS]) {
        for (const alerts of [null, ...Object.values(TRACKING_ALERT_FILTER)]) {
          for (const sort of sorts) {
            for (const offset of [0, 40]) {
              yield normalizeTrackingQuery({ filters: { level, adherenceMin, adherenceMax, alerts }, sort, offset });
            }
          }
        }
      }
    }
  }
}

describe('Contrato de proyección RF-142 (frontend)', () => {
  it('ninguna consulta posible envía un parámetro fuera de la lista blanca ni uno restringido', () => {
    const seen = new Set();
    let count = 0;

    for (const query of everyQuery()) {
      const params = toTrackingParams(query);
      Object.keys(params).forEach((key) => seen.add(key));
      for (const [key, value] of Object.entries(params)) {
        expect(RESTRICTED.test(key)).toBe(false);
        expect(RESTRICTED.test(String(value))).toBe(false);
      }
      if (params.adherencia_min !== undefined && params.adherencia_max !== undefined) {
        expect(params.adherencia_min).toBeLessThanOrEqual(params.adherencia_max);
      }
      count += 1;
    }

    expect(count).toBeGreaterThan(1000);
    expect([...seen].sort()).toEqual([...ALLOWED_REQUEST_PARAMS].sort());
  });

  it('la URL solo admite su lista de parámetros, y lo que lee nunca produce un parámetro restringido', () => {
    expect(Object.values(TRACKING_SEARCH_PARAM).sort()).toEqual([...ALLOWED_URL_PARAMS].sort());

    const hostile = new URLSearchParams({
      incluir_texto: 'true',
      texto_diario: '1',
      mensajes_chat: '1',
      correo: 'a@b.c',
      campos: 'texto_diario',
      nivel: 'texto_diario',
      orden: 'correo',
      direccion: 'DESC',
      adherencia_min: '0.25',
      alertas: 'mensajes',
      pagina: '1e3',
    }).toString();
    const query = parseTrackingSearch(hostile);

    expect(toTrackingParams(query)).toEqual({ offset: 0, limit: 20 });
    expect(toTrackingSearch(query)).toBe('');
  });

  it('la URL de cada consulta posible vuelve a dar la misma consulta (ida y vuelta)', () => {
    for (const query of everyQuery()) {
      const search = toTrackingSearch(query);
      for (const key of new URLSearchParams(search).keys()) expect(ALLOWED_URL_PARAMS).toContain(key);
      expect(parseTrackingSearch(search)).toEqual(query);
    }
  });

  it('cada registro expone exactamente los campos permitidos, aunque la respuesta traiga más', () => {
    const result = interpretTrackingResponse({
      items: [
        {
          codigo_participante: 'P-7F3A91C2',
          nivel_progreso: 'EN_AVANCE',
          tasa_adherencia: 0.41,
          alertas_activas: 1,
          alertas_atendidas: 0,
          tipos_alerta_activa: ['INACTIVIDAD'],
          id_usuario: 'c0000000-0000-4000-8000-000000000001',
          correo: 'nunca@se.muestra',
          texto_diario: 'texto',
          mensajes_chat: ['hola'],
          nombre: 'Nombre',
        },
      ],
      total: 1,
      offset: 0,
      limit: 20,
    });

    expect(Object.keys(result).sort()).toEqual(['entries', 'limit', 'offset', 'outcome', 'total']);
    expect(Object.keys(result.entries[0]).sort()).toEqual([...EXPOSED_ENTRY_FIELDS].sort());
    expect(JSON.stringify(result)).not.toMatch(/c0000000|@|texto|hola|Nombre/);
  });
});
