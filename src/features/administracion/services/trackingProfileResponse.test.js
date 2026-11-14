import { describe, expect, it } from 'vitest';

import { INDICATOR_STATE, PROFILE_OUTCOME, TRACKING_ACCESS } from '../types/participantTracking.js';
import { interpretProfileResponse } from './trackingProfileResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const response = (changes = {}, profileChanges = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  code: 'X-1',
  profile: {
    progress: 62.5,
    adherence: 70,
    trend: 'REDUCCION',
    activeAlerts: [{ type: 'INACTIVIDAD', generatedAt: '2026-03-08T07:30:00-05:00' }],
    updatedAt: '2026-03-09T06:00:00-05:00',
    ...profileChanges,
  },
  ...changes,
});

describe('Autorización explícita (RF-128)', () => {
  it('con AUTORIZADO conserva el perfil', () => {
    expect(interpretProfileResponse(response(), REQUEST).outcome).toBe(PROFILE_OUTCOME.OK);
  });

  it.each([
    ['DENEGADO', { access: TRACKING_ACCESS.DENIED }],
    ['sin campo de acceso', { access: undefined }],
    ['valor desconocido', { access: 'SI' }],
    ['booleano', { access: true }],
  ])('%s: denegado, sin código ni indicadores aunque la respuesta los traiga', (_, changes) => {
    const result = interpretProfileResponse(response(changes), REQUEST);

    expect(result).toEqual({ outcome: PROFILE_OUTCOME.DENIED });
    expect(JSON.stringify(result)).not.toMatch(/X-1|62|REDUCCION|INACTIVIDAD/);
  });

  it('una respuesta nula se trata como denegada', () => {
    expect(interpretProfileResponse(null, REQUEST).outcome).toBe(PROFILE_OUTCOME.DENIED);
  });
});

describe('Aislamiento por participante y cohorte', () => {
  it('información de otro participante (409 de RF-128): se bloquea entera', () => {
    expect(interpretProfileResponse(response({ reference: 'ref-2' }), REQUEST)).toEqual({ outcome: PROFILE_OUTCOME.INCONSISTENT });
  });

  it('información de otra cohorte: se bloquea entera', () => {
    expect(interpretProfileResponse(response({ cohortId: 'c-2' }), REQUEST)).toEqual({ outcome: PROFILE_OUTCOME.INCONSISTENT });
  });

  it('sin referencia o cohorte declaradas no se puede verificar: se bloquea', () => {
    expect(interpretProfileResponse(response({ reference: undefined }), REQUEST).outcome).toBe(PROFILE_OUTCOME.INCONSISTENT);
    expect(interpretProfileResponse(response({ cohortId: undefined }), REQUEST).outcome).toBe(PROFILE_OUTCOME.INCONSISTENT);
  });
});

describe('Sin perfil (204 de RF-128)', () => {
  it.each([[null], [undefined], ['texto']])('perfil %s: sin perfil, pero conserva el código para el encabezado', (profile) => {
    expect(interpretProfileResponse(response({ profile }), REQUEST)).toEqual({ outcome: PROFILE_OUTCOME.NO_PROFILE, code: 'X-1', profile: null });
  });
});

describe('Lista explícita de campos', () => {
  it('conserva solo código e indicadores de RF-128 y descarta todo lo demás', () => {
    const result = interpretProfileResponse(
      response(
        { participantId: 'uuid-interno', email: 'persona@example.com', nombre: 'Nombre Apellido', participationStatus: 'ACTIVO' },
        { cravingLevel: 5, diaryText: 'texto privado', chat: ['hola'], indicadoresDetalle: { a: 1 } },
      ),
      REQUEST,
    );

    expect(result).toEqual({
      outcome: PROFILE_OUTCOME.OK,
      code: 'X-1',
      profile: {
        progress: { state: INDICATOR_STATE.AVAILABLE, value: 62.5 },
        adherence: { state: INDICATOR_STATE.AVAILABLE, value: 70 },
        trend: 'REDUCCION',
        activeAlerts: [{ type: 'INACTIVIDAD', generatedAt: '2026-03-08T07:30:00-05:00' }],
        updatedAt: '2026-03-09T06:00:00-05:00',
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/uuid-interno|@|Nombre|ACTIVO|cravingLevel|texto privado|hola|indicadoresDetalle/);
    expect(Object.isFrozen(result.profile)).toBe(true);
  });

  it('las alertas solo conservan tipo y fecha', () => {
    const { profile } = interpretProfileResponse(
      response({}, { activeAlerts: [{ type: 'CRAVING_ELEVADO', generatedAt: 'x', nivel: 5, nota: 'clínica' }, null, 'basura'] }),
      REQUEST,
    );

    expect(profile.activeAlerts).toEqual([{ type: 'CRAVING_ELEVADO', generatedAt: 'x' }]);
  });
});

describe('Indicadores tal como llegan', () => {
  it.each([
    ['número', 37.25, { state: INDICATOR_STATE.AVAILABLE, value: 37.25 }],
    ['cero', 0, { state: INDICATOR_STATE.AVAILABLE, value: 0 }],
    ['fuera de 0-100 (sin suponer unidades)', 140, { state: INDICATOR_STATE.AVAILABLE, value: 140 }],
    ['NO_CALCULABLE', 'NO_CALCULABLE', { state: INDICATOR_STATE.NOT_CALCULABLE, value: null }],
    ['null', null, { state: INDICATOR_STATE.NOT_AVAILABLE, value: null }],
    ['texto numérico', '80', { state: INDICATOR_STATE.NOT_AVAILABLE, value: null }],
    ['infinito', Infinity, { state: INDICATOR_STATE.NOT_AVAILABLE, value: null }],
    ['objeto (conjunto JSON sin contrato)', { valor: 3 }, { state: INDICATOR_STATE.NOT_AVAILABLE, value: null }],
  ])('%s', (_, value, expected) => {
    expect(interpretProfileResponse(response({}, { progress: value }), REQUEST).profile.progress).toEqual(expected);
  });

  it('tendencia y fechas ausentes quedan como null; alertas que no son lista, como no disponibles', () => {
    const { profile } = interpretProfileResponse(response({}, { trend: 7, updatedAt: '', activeAlerts: 'ninguna' }), REQUEST);

    expect(profile).toMatchObject({ trend: null, updatedAt: null, activeAlerts: null });
  });

  it('una tendencia fuera del enumerado se conserva tal cual, sin interpretarla', () => {
    expect(interpretProfileResponse(response({}, { trend: 'ESTABILIZACION' }), REQUEST).profile.trend).toBe('ESTABILIZACION');
  });
});
