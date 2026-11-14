import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_TRACKING_QUERY, withFilter, withPage, withSort } from '../services/trackingQuery.js';
import { interpretTrackingResponse } from '../services/trackingResponse.js';
import { TRACKING_ACCESS, TRACKING_QUERY_ERROR, TRACKING_SOURCE_MODE } from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { createCohort } from './cohortSource.js';
import { DEMO_TRACKING_INDICATORS } from './trackingDemoData.js';
import { assignParticipants, removeCohortParticipant } from './participantSource.js';
import { getTrackingSourceMode, listCohortTracking } from './trackingSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_TRACKING_SCENARIO', scenario);
}

const codes = (response) => response.items.map(({ code }) => code);
const all = (query = INITIAL_TRACKING_QUERY) => ({ ...query, limit: 50 });

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // La consulta de seguimiento no hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Fuente de seguimiento sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: integración pendiente y ningún registro ficticio', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    expect(getTrackingSourceMode()).toBe(TRACKING_SOURCE_MODE.PENDING_INTEGRATION);
    await expect(listCohortTracking('demo-cohorte-b', INITIAL_TRACKING_QUERY)).rejects.toThrow('no está integrada');
  });
});

describe('Relación con la cohorte (demostración)', () => {
  it('lista los participantes asociados a la cohorte, con autorización explícita', async () => {
    enableDemo();
    const response = await listCohortTracking('demo-cohorte-b', all());

    expect(getTrackingSourceMode()).toBe(TRACKING_SOURCE_MODE.DEMO);
    expect(response).toMatchObject({ access: TRACKING_ACCESS.GRANTED, cohortId: 'demo-cohorte-b', total: 6 });
    expect(codes(response)).toEqual(['PART-0001', 'PART-0002', 'PART-0003', 'PART-0004', 'PART-0005', 'PART-0006']);
    expect(response.items.every(({ cohortId }) => cohortId === 'demo-cohorte-b')).toBe(true);
  });

  it('una cohorte sin participantes devuelve una lista vacía autorizada', async () => {
    enableDemo();

    expect(await listCohortTracking('demo-cohorte-a', all())).toMatchObject({ access: TRACKING_ACCESS.GRANTED, total: 0, items: [] });
  });

  it('una cohorte inexistente rechaza con su código', async () => {
    enableDemo();

    const error = await listCohortTracking('no-existe', all()).catch((reason) => reason);
    expect(error.code).toBe(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND);
  });

  it('sigue las asociaciones actuales de E6 y E7, sin duplicar datos', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');
    await assignParticipants('demo-cohorte-b', ['demo-candidato-11']);

    expect(codes(await listCohortTracking('demo-cohorte-b', all()))).toEqual([
      'PART-0001', 'PART-0002', 'PART-0004', 'PART-0005', 'PART-0006', 'PART-0011',
    ]);
  });

  it('un participante sin indicadores aparece como no disponible, sin deducirlos de su elegibilidad', async () => {
    enableDemo();
    const created = await createCohort({ name: 'Cohorte X', startDate: '2026-08-03', endDate: '2026-11-27', scheduleId: 'demo-cronograma-3' });
    await assignParticipants(created.id, ['demo-candidato-11']);

    const [row] = (await listCohortTracking(created.id, all())).items;
    expect(DEMO_TRACKING_INDICATORS['demo-candidato-11']).toBeUndefined();
    expect(row).toMatchObject({ code: 'PART-0011', progress: null, adherence: null, activeAlertCount: null });
  });

  it('incluye campos adicionales que la interfaz descarta', async () => {
    enableDemo();
    const response = await listCohortTracking('demo-cohorte-b', all());

    expect(Object.keys(response.items[0])).toEqual(expect.arrayContaining(['participantId', 'participationStatus']));
    expect(interpretTrackingResponse(response, 'demo-cohorte-b').entries[0]).toEqual({
      code: 'PART-0001', progress: 82, adherence: 91, activeAlertCount: 0,
    });
  });
});

describe('Filtros, orden y paginación aplicados por la fuente', () => {
  it('filtra por progreso, adherencia y alertas activas', async () => {
    enableDemo();

    expect(codes(await listCohortTracking('demo-cohorte-b', all(withFilter(INITIAL_TRACKING_QUERY, 'progressMin', '50'))))).toEqual(['PART-0001', 'PART-0003', 'PART-0006']);
    expect(codes(await listCohortTracking('demo-cohorte-b', all(withFilter(INITIAL_TRACKING_QUERY, 'adherenceMin', '75'))))).toEqual(['PART-0001']);
    expect(codes(await listCohortTracking('demo-cohorte-b', all(withFilter(INITIAL_TRACKING_QUERY, 'alerts', 'con-alertas'))))).toEqual(['PART-0002', 'PART-0004', 'PART-0006']);
    expect(codes(await listCohortTracking('demo-cohorte-b', all(withFilter(INITIAL_TRACKING_QUERY, 'alerts', 'sin-alertas'))))).toEqual(['PART-0001', 'PART-0003']);
  });

  it('un filtro sin resultados devuelve una lista vacía autorizada', async () => {
    enableDemo();
    const query = withFilter(withFilter(INITIAL_TRACKING_QUERY, 'progressMin', '75'), 'alerts', 'con-alertas');

    expect(await listCohortTracking('demo-cohorte-b', all(query))).toMatchObject({ total: 0, items: [] });
  });

  it('ordena por indicador, con los no disponibles al final', async () => {
    enableDemo();

    expect(codes(await listCohortTracking('demo-cohorte-b', all(withSort(INITIAL_TRACKING_QUERY, { field: 'progreso', direction: 'desc' }))))).toEqual(['PART-0001', 'PART-0003', 'PART-0006', 'PART-0002', 'PART-0004', 'PART-0005']);
    expect(codes(await listCohortTracking('demo-cohorte-b', all(withSort(INITIAL_TRACKING_QUERY, { field: 'adherencia', direction: 'asc' }))))).toEqual(['PART-0004', 'PART-0006', 'PART-0002', 'PART-0003', 'PART-0001', 'PART-0005']);
    expect(codes(await listCohortTracking('demo-cohorte-b', all(withSort(INITIAL_TRACKING_QUERY, { field: 'alertas', direction: 'desc' })))).slice(0, 3)).toEqual(['PART-0004', 'PART-0002', 'PART-0006']);
  });

  it('pagina con offset y limit, informando el total', async () => {
    enableDemo();
    const first = await listCohortTracking('demo-cohorte-b', INITIAL_TRACKING_QUERY);
    const second = await listCohortTracking('demo-cohorte-b', withPage(INITIAL_TRACKING_QUERY, 1, first.total));

    expect(first).toMatchObject({ total: 6, offset: 0, limit: 5 });
    expect(first.items).toHaveLength(5);
    expect(second).toMatchObject({ total: 6, offset: 5 });
    expect(codes(second)).toEqual(['PART-0006']);
  });
});

describe('Escenarios de seguimiento', () => {
  it('denegado: la respuesta declara DENEGADO aunque traiga registros', async () => {
    enableDemo('denegado');
    const response = await listCohortTracking('demo-cohorte-b', all());

    expect(response.access).toBe(TRACKING_ACCESS.DENIED);
    expect(response.items.length).toBeGreaterThan(0);
    expect(interpretTrackingResponse(response, 'demo-cohorte-b')).toEqual({ outcome: 'DENIED' });
  });

  it('registro-ajeno: un registro declara otra cohorte', async () => {
    enableDemo('registro-ajeno');
    const result = interpretTrackingResponse(await listCohortTracking('demo-cohorte-b', all()), 'demo-cohorte-b');

    expect(result.blockedCount).toBe(1);
    expect(result.entries.map(({ code }) => code)).not.toContain('AJENO-0000');
  });

  it('respuesta-ajena: la respuesta entera declara otra cohorte', async () => {
    enableDemo('respuesta-ajena');

    expect(interpretTrackingResponse(await listCohortTracking('demo-cohorte-b', all()), 'demo-cohorte-b')).toEqual({ outcome: 'INCONSISTENT' });
  });

  it('error: rechaza sin código ni datos de reemplazo', async () => {
    enableDemo('error');

    const error = await listCohortTracking('demo-cohorte-b', all()).catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBeUndefined();
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      listCohortTracking('demo-cohorte-b', all()).then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('los escenarios de cohortes no afectan el seguimiento', async () => {
    enableDemo();
    vi.stubEnv('VITE_M08_DEMO_SCENARIO', 'error-participantes');

    expect((await listCohortTracking('demo-cohorte-b', all())).total).toBe(6);
  });
});
