import { describe, expect, it } from 'vitest';

import { SECTION_OUTCOME } from '../types/participantEngagement.js';
import { INDICATOR_STATE, NOT_CALCULABLE, TRACKING_ACCESS } from '../types/participantTracking.js';
import { interpretNotificationInteractionResponse } from './notificationInteractionResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const FULL = Object.freeze({
  sent: 35, delivered: 33, opened: 14, dismissed: 11, sessionsFromNotification: 7,
  openRate: 0.4242, conversionRate: 0.2, dismissalRate: 0.3333,
});

const response = (metrics, changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  metrics,
  ...changes,
});

const interpret = (value) => interpretNotificationInteractionResponse(value, REQUEST);
const available = (value) => ({ state: INDICATOR_STATE.AVAILABLE, value });
const NOT_AVAILABLE = { state: INDICATOR_STATE.NOT_AVAILABLE, value: null };
const CALC = { state: INDICATOR_STATE.NOT_CALCULABLE, value: null };

describe('Interacción con notificaciones (RF-131)', () => {
  it('autorizada: los cinco totales y las tres tasas, tal como llegan', () => {
    const { outcome, data } = interpret(response(FULL));

    expect(outcome).toBe(SECTION_OUTCOME.OK);
    expect(data.counts).toEqual({
      sent: available(35), delivered: available(33), opened: available(14), dismissed: available(11), sessionsFromNotification: available(7),
    });
    expect(data.rates).toEqual({ openRate: available(0.4242), conversionRate: available(0.2), dismissalRate: available(0.3333) });
    expect(data.hasNotCalculable).toBe(false);
  });

  it('lista explícita: descarta contenido de mensajes, eventos, identificadores y correo', () => {
    const result = interpret(response(
      { ...FULL, lastMessage: 'Texto del mensaje', triggerEvent: 'CRAVING', notificationIds: ['uuid-1'] },
      { email: 'x@example.com', participantId: 'interno' },
    ));

    expect(Object.keys(result.data.counts).sort()).toEqual(['delivered', 'dismissed', 'opened', 'sent', 'sessionsFromNotification']);
    expect(Object.keys(result.data.rates).sort()).toEqual(['conversionRate', 'dismissalRate', 'openRate']);
    expect(JSON.stringify(result)).not.toMatch(/mensaje|CRAVING|uuid|@|interno|ref-1/i);
  });

  it('distingue cero real, dato ausente y NO_CALCULABLE; NO_CALCULABLE nunca es cero', () => {
    const { data } = interpret(response({ ...FULL, opened: 0, openRate: 0, dismissed: null, conversionRate: NOT_CALCULABLE, sent: NOT_CALCULABLE }));

    expect(data.counts.opened).toEqual(available(0));
    expect(data.rates.openRate).toEqual(available(0));
    expect(data.counts.dismissed).toEqual(NOT_AVAILABLE);
    expect(data.rates.conversionRate).toEqual(CALC);
    expect(data.counts.sent).toEqual(CALC);
    expect(data.hasNotCalculable).toBe(true);
  });

  it.each([
    ['negativo', -3],
    ['fraccionario', 10.5],
    ['texto numérico', '7'],
    ['infinito', Infinity],
  ])('total %s: no disponible', (_, value) => {
    expect(interpret(response({ ...FULL, sent: value })).data.counts.sent).toEqual(NOT_AVAILABLE);
  });

  it('tasas: cualquier número finito se conserva sin convertir ni acotar; texto o NaN no', () => {
    expect(interpret(response({ ...FULL, openRate: 42.5 })).data.rates.openRate).toEqual(available(42.5));
    expect(interpret(response({ ...FULL, openRate: 'alta' })).data.rates.openRate).toEqual(NOT_AVAILABLE);
    expect(interpret(response({ ...FULL, openRate: Number.NaN })).data.rates.openRate).toEqual(NOT_AVAILABLE);
  });

  it('no calcula tasas a partir de los totales', () => {
    const { data } = interpret(response({ ...FULL, openRate: undefined }));

    expect(data.rates.openRate).toEqual(NOT_AVAILABLE);
  });

  it.each([
    ['DENEGADO', response(FULL, { access: TRACKING_ACCESS.DENIED }), SECTION_OUTCOME.DENIED],
    ['sin acceso declarado', response(FULL, { access: undefined }), SECTION_OUTCOME.DENIED],
    ['otro participante', response(FULL, { reference: 'ref-2' }), SECTION_OUTCOME.INCONSISTENT],
    ['otra cohorte', response(FULL, { cohortId: 'c-2' }), SECTION_OUTCOME.INCONSISTENT],
    ['sin métricas (204)', response(null), SECTION_OUTCOME.EMPTY],
    ['forma inválida', response([1, 2]), SECTION_OUTCOME.MALFORMED],
  ])('%s: sin datos', (_, value, outcome) => {
    expect(interpret(value)).toEqual({ outcome });
  });
});
