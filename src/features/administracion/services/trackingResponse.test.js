import { describe, expect, it } from 'vitest';

import { TRACKING_OUTCOME } from '../types/participantTracking.js';

import { interpretTrackingResponse, isOutOfRange } from './trackingResponse.js';

const item = (changes = {}) => ({
  codigo_participante: 'P-7F3A91C2',
  nivel_progreso: 'EN_AVANCE',
  tasa_adherencia: 0.41,
  alertas_activas: 2,
  alertas_atendidas: 0,
  tipos_alerta_activa: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
  ...changes,
});

const page = (items = [item()], changes = {}) => ({ items, total: items.length, offset: 0, limit: 20, ...changes });

describe('interpretTrackingResponse (RF-142, contrato real)', () => {
  it('200 con participantes: solo los campos del contrato, en el orden del servidor', () => {
    const second = item({ codigo_participante: 'P-00000001', nivel_progreso: 'COMPLETADO', tasa_adherencia: 1, alertas_activas: 0, alertas_atendidas: 3, tipos_alerta_activa: [] });
    const result = interpretTrackingResponse(page([item(), second], { total: 25 }));

    expect(result).toEqual({
      outcome: TRACKING_OUTCOME.OK,
      entries: [
        {
          code: 'P-7F3A91C2',
          progressLevel: 'EN_AVANCE',
          adherence: 0.41,
          activeAlertCount: 2,
          attendedAlertCount: 0,
          activeAlertTypes: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
        },
        {
          code: 'P-00000001',
          progressLevel: 'COMPLETADO',
          adherence: 1,
          activeAlertCount: 0,
          attendedAlertCount: 3,
          activeAlertTypes: [],
        },
      ],
      total: 25,
      offset: 0,
      limit: 20,
    });
  });

  it('no exige campos de autorización ni de cohorte que el contrato no tiene', () => {
    expect(interpretTrackingResponse(page()).outcome).toBe(TRACKING_OUTCOME.OK);
  });

  it('descarta cualquier campo ajeno (UUID, correo, textos)', () => {
    const result = interpretTrackingResponse(
      page([item({ id_usuario: 'c0000000-0000-4000-8000-000000000001', correo: 'a@b.co', texto_diario: 'x' })]),
    );

    expect(JSON.stringify(result)).not.toMatch(/c0000000|@|texto|id_usuario/);
  });

  it('sin indicadores calculados: null se conserva como null, nunca como 0', () => {
    const [entry] = interpretTrackingResponse(page([item({ nivel_progreso: null, tasa_adherencia: null })])).entries;

    expect(entry.progressLevel).toBeNull();
    expect(entry.adherence).toBeNull();
  });

  it.each([0, 1, 0.5])('adherencia %s dentro de 0–1', (value) => {
    expect(interpretTrackingResponse(page([item({ tasa_adherencia: value })])).outcome).toBe(TRACKING_OUTCOME.OK);
  });

  it('listado vacío (cohorte sin participantes, con mensaje)', () => {
    const result = interpretTrackingResponse({ items: [], total: 0, offset: 0, limit: 20, mensaje: 'No se encontraron participantes.' });

    expect(result).toMatchObject({ outcome: TRACKING_OUTCOME.OK, entries: [], total: 0 });
    expect(isOutOfRange(result)).toBe(false);
  });

  it('página fuera de rango: sin filas con total > 0', () => {
    expect(isOutOfRange(interpretTrackingResponse({ items: [], total: 3, offset: 20, limit: 20 }))).toBe(true);
  });

  it.each([
    ['nulo', null],
    ['sin items', { total: 0, offset: 0, limit: 20 }],
    ['total negativo', page([], { total: -1 })],
    ['limit 0', page([], { limit: 0 })],
    ['más filas que el límite', page([item(), item({ codigo_participante: 'P-00000001' })], { limit: 1 })],
    ['más filas que el total', page([item()], { total: 0 })],
    ['adherencia como porcentaje', page([item({ tasa_adherencia: 41 })])],
    ['adherencia negativa', page([item({ tasa_adherencia: -0.1 })])],
    ['nivel desconocido', page([item({ nivel_progreso: 'EXPERTO' })])],
    ['nivel como número', page([item({ nivel_progreso: 50 })])],
    ['conteo decimal', page([item({ alertas_activas: 1.5 })])],
    ['conteo ausente', page([item({ alertas_atendidas: undefined })])],
    ['tipo de alerta desconocido', page([item({ tipos_alerta_activa: ['RECAIDA'] })])],
    ['alertas activas sin tipos', page([item({ alertas_activas: 1, tipos_alerta_activa: [] })])],
    ['código con correo', page([item({ codigo_participante: 'persona@correo.com' })])],
    ['código vacío', page([item({ codigo_participante: '' })])],
    ['código repetido', page([item(), item()], { total: 2 })],
  ])('respuesta inválida (%s): no se presenta a medias', (_, data) => {
    expect(interpretTrackingResponse(data)).toEqual({ outcome: TRACKING_OUTCOME.INVALID });
  });
});
