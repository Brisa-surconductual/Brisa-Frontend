import { describe, expect, it } from 'vitest';

import { TRACKING_ACCESS, TRACKING_OUTCOME } from '../types/participantTracking.js';
import { interpretTrackingResponse } from './trackingResponse.js';

const item = (changes = {}) => ({
  cohortId: 'c-1',
  code: 'X-1',
  progress: 40,
  adherence: 70,
  activeAlertCount: 1,
  ...changes,
});

const response = (changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  total: 1,
  offset: 0,
  limit: 5,
  items: [item()],
  ...changes,
});

describe('Autorización explícita', () => {
  it('con AUTORIZADO conserva los registros', () => {
    expect(interpretTrackingResponse(response(), 'c-1')).toMatchObject({ outcome: TRACKING_OUTCOME.OK, total: 1 });
  });

  it.each([
    ['DENEGADO', { access: TRACKING_ACCESS.DENIED }],
    ['sin campo de acceso', { access: undefined }],
    ['valor desconocido', { access: 'SI' }],
    ['booleano', { access: true }],
  ])('%s: denegado y sin ningún registro, aunque la respuesta los traiga', (_, changes) => {
    const result = interpretTrackingResponse(response(changes), 'c-1');

    expect(result).toEqual({ outcome: TRACKING_OUTCOME.DENIED });
    expect(JSON.stringify(result)).not.toContain('X-1');
  });

  it('una respuesta vacía o nula se trata como denegada', () => {
    expect(interpretTrackingResponse(null, 'c-1').outcome).toBe(TRACKING_OUTCOME.DENIED);
    expect(interpretTrackingResponse(undefined, 'c-1').outcome).toBe(TRACKING_OUTCOME.DENIED);
  });
});

describe('Correspondencia con la cohorte', () => {
  it('una respuesta de otra cohorte se bloquea entera', () => {
    const result = interpretTrackingResponse(response({ cohortId: 'c-2' }), 'c-1');

    expect(result).toEqual({ outcome: TRACKING_OUTCOME.INCONSISTENT });
  });

  it('un registro de otra cohorte se descarta y se cuenta', () => {
    const result = interpretTrackingResponse(
      response({ items: [item(), item({ cohortId: 'c-2', code: 'AJENO' }), item({ cohortId: undefined, code: 'SIN' })] }),
      'c-1',
    );

    expect(result.entries.map(({ code }) => code)).toEqual(['X-1']);
    expect(result.blockedCount).toBe(2);
  });
});

describe('Lista explícita de campos', () => {
  it('conserva solo código, progreso, adherencia y alertas activas', () => {
    const result = interpretTrackingResponse(
      response({
        items: [item({
          participantId: 'uuid-interno',
          correoElectronico: 'persona@example.com',
          nombre: 'Nombre Apellido',
          participationStatus: 'PENDIENTE_VALIDACION',
          textoDiario: 'texto',
          mensajesChat: ['hola'],
        })],
      }),
      'c-1',
    );

    expect(result.entries).toEqual([{ code: 'X-1', reference: null, progress: 40, adherence: 70, activeAlertCount: 1 }]);
    expect(Object.isFrozen(result.entries[0])).toBe(true);
  });

  it('valores fuera de rango o de otro tipo quedan como no disponibles, sin estimarlos', () => {
    const [entry] = interpretTrackingResponse(
      response({ items: [item({ code: 7, progress: 140, adherence: '80', activeAlertCount: -1 })] }),
      'c-1',
    ).entries;

    expect(entry).toEqual({ code: '', reference: null, progress: null, adherence: null, activeAlertCount: null });
  });

  it('total y offset inválidos se sustituyen por valores seguros', () => {
    const result = interpretTrackingResponse(response({ total: 'muchos', offset: -1 }), 'c-1');

    expect(result).toMatchObject({ total: 1, offset: 0 });
  });
});

describe('Referencia opaca de la ficha (RF-128)', () => {
  it('conserva la referencia recibida como texto, sin derivarla de otros campos', () => {
    const [entry] = interpretTrackingResponse(response({ items: [item({ reference: ' seg-abc123 ', participantId: 'uuid-interno' })] }), 'c-1').entries;

    expect(entry.reference).toBe('seg-abc123');
  });

  it.each([[undefined], [''], ['   '], [42], [{ id: 'x' }]])('una referencia ausente o inválida (%s) queda como null', (reference) => {
    const [entry] = interpretTrackingResponse(response({ items: [item({ reference })] }), 'c-1').entries;

    expect(entry.reference).toBeNull();
  });
});
