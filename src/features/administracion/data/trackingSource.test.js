import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TRACKING_CLIENT_ERROR } from '../services/trackingErrors.js';
import { INITIAL_TRACKING_QUERY, valueToSort, withFilter, withPage, withSort } from '../services/trackingQuery.js';
import { interpretTrackingResponse } from '../services/trackingResponse.js';
import { PROGRESS_LEVELS, TRACKING_OUTCOME, TRACKING_SOURCE_MODE } from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { createCohort } from './cohortSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { assignParticipants, removeCohortParticipant } from './participantSource.js';
import { getParticipantTrackingProfile, getTrackingSourceMode, listCohortTracking } from './trackingSource.js';

const http = vi.hoisted(() => ({
  fetchCohortParticipantIndicators: vi.fn(),
  fetchParticipantTrackingProfile: vi.fn(),
  listCohortParticipants: vi.fn(),
}));

vi.mock('../api/seguimientoParticipantesApi.js', () => ({
  fetchCohortParticipantIndicators: http.fetchCohortParticipantIndicators,
  fetchParticipantTrackingProfile: http.fetchParticipantTrackingProfile,
}));

vi.mock('../api/participantesCohorteApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  listCohortParticipants: http.listCohortParticipants,
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const CODE = 'P-7F3A91C2';

const member = (code, participationStatus = 'ACTIVO') => ({ code, participationStatus });

function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_TRACKING_SCENARIO', scenario);
}

function useApi() {
  vi.stubEnv('VITE_M08_DEMO', '');
}

const codes = (response) => response.items.map(({ codigo_participante: code }) => code);
const all = (query = INITIAL_TRACKING_QUERY) => ({ ...query, limit: 50 });

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Modo de la fuente', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: API real', (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    expect(getTrackingSourceMode()).toBe(TRACKING_SOURCE_MODE.API);
  });

  it('con VITE_M08_DEMO=true en desarrollo: demostración', () => {
    enableDemo();

    expect(getTrackingSourceMode()).toBe(TRACKING_SOURCE_MODE.DEMO);
  });
});

describe('Listado en la API (RF-142)', () => {
  it('pide al backend los filtros, el orden y la página con sus nombres reales', async () => {
    useApi();
    const body = { items: [], total: 0, offset: 0, limit: 20 };
    const signal = new AbortController().signal;
    http.fetchCohortParticipantIndicators.mockResolvedValue(body);
    const query = withSort(withFilter(withFilter(INITIAL_TRACKING_QUERY, 'level', 'AVANZADO'), 'alerts', 'false'), valueToSort('alertas_atendidas:DESC'));

    await expect(listCohortTracking(COHORT, query, { signal })).resolves.toBe(body);
    expect(http.fetchCohortParticipantIndicators).toHaveBeenCalledWith(
      COHORT,
      { nivel_progreso: 'AVANZADO', con_alertas: 'false', orden_campo: 'alertas_atendidas', orden_direccion: 'DESC', offset: 0, limit: 20 },
      { signal },
    );
  });

  it('nunca carga la demostración ni datos ficticios', async () => {
    useApi();
    http.fetchCohortParticipantIndicators.mockRejectedValue({ status: 503, codigo: 'M05_NO_DISPONIBLE' });

    await expect(listCohortTracking('demo-cohorte-b', INITIAL_TRACKING_QUERY)).rejects.toMatchObject({ status: 503 });
  });
});

describe('Ficha en la API (RF-128): identidad y pertenencia', () => {
  it('comprueba la pertenencia activa a la cohorte y luego pide el perfil por el seudónimo', async () => {
    useApi();
    const body = { codigo_participante: CODE };
    http.listCohortParticipants.mockResolvedValue([member('P-00000001'), member(CODE)]);
    http.fetchParticipantTrackingProfile.mockResolvedValue(body);

    await expect(getParticipantTrackingProfile(COHORT, 'p-7f3a91c2')).resolves.toBe(body);
    expect(http.listCohortParticipants).toHaveBeenCalledWith(COHORT);
    expect(http.fetchParticipantTrackingProfile).toHaveBeenCalledWith(CODE, undefined);
    expect(http.listCohortParticipants.mock.invocationCallOrder[0]).toBeLessThan(
      http.fetchParticipantTrackingProfile.mock.invocationCallOrder[0],
    );
  });

  it('204: sin perfil', async () => {
    useApi();
    http.listCohortParticipants.mockResolvedValue([member(CODE)]);
    http.fetchParticipantTrackingProfile.mockResolvedValue(null);

    await expect(getParticipantTrackingProfile(COHORT, CODE)).resolves.toBeNull();
  });

  it.each([
    ['referencia ficticia', 'seg-k7m2q9'],
    ['código de la demostración', 'PART-0004'],
    ['UUID', 'c0000000-0000-4000-8000-000000000001'],
    ['correo', 'persona@correo.com'],
    ['vacío', ''],
    ['nulo', null],
  ])('identificador falso (%s): ninguna petición', async (_, code) => {
    useApi();

    await expect(getParticipantTrackingProfile(COHORT, code)).rejects.toMatchObject({ codigo: TRACKING_CLIENT_ERROR.INVALID_CODE });
    expect(http.listCohortParticipants).not.toHaveBeenCalled();
    expect(http.fetchParticipantTrackingProfile).not.toHaveBeenCalled();
  });

  it.each([
    ['no es miembro de la cohorte', [member('P-00000001')]],
    ['fue retirado de la cohorte', [member(CODE, 'INACTIVO')]],
    ['está pendiente de validación', [member(CODE, 'PENDIENTE_VALIDACION')]],
    ['la cohorte no tiene participantes', []],
  ])('acceso directo por URL a un participante que %s: no se pide el perfil', async (_, members) => {
    useApi();
    http.listCohortParticipants.mockResolvedValue(members);

    await expect(getParticipantTrackingProfile(COHORT, CODE)).rejects.toMatchObject({ codigo: TRACKING_CLIENT_ERROR.OUTSIDE_COHORT });
    expect(http.fetchParticipantTrackingProfile).not.toHaveBeenCalled();
  });

  it('cohorte inexistente: 404 COHORTE_NO_ENCONTRADA sin pedir el perfil', async () => {
    useApi();
    http.listCohortParticipants.mockResolvedValue(null);

    await expect(getParticipantTrackingProfile(COHORT, CODE)).rejects.toMatchObject({ status: 404, codigo: 'COHORTE_NO_ENCONTRADA' });
    expect(http.fetchParticipantTrackingProfile).not.toHaveBeenCalled();
  });

  it('la comprobación de pertenencia falla (403, red o respuesta inválida): no se pide el perfil', async () => {
    useApi();
    http.listCohortParticipants.mockRejectedValue({ status: 403, codigo: 'ACCESO_DENEGADO' });

    await expect(getParticipantTrackingProfile(COHORT, CODE)).rejects.toMatchObject({ status: 403 });
    expect(http.fetchParticipantTrackingProfile).not.toHaveBeenCalled();
  });

  it.each([
    [403, 'SIN_PERMISO_INDIVIDUAL'],
    [404, 'PARTICIPANTE_NO_ENCONTRADO'],
    [409, 'INCONSISTENCIA_PARTICIPANTE'],
    [503, 'M05_NO_DISPONIBLE'],
  ])('el error %i %s del perfil llega sin alterarse', async (status, codigo) => {
    useApi();
    http.listCohortParticipants.mockResolvedValue([member(CODE)]);
    http.fetchParticipantTrackingProfile.mockRejectedValue({ status, codigo });

    await expect(getParticipantTrackingProfile(COHORT, CODE)).rejects.toEqual({ status, codigo });
  });
});

describe('Listado en la demostración: forma del contrato real', () => {
  it('lista los participantes activos con la forma real, sin HTTP', async () => {
    enableDemo();
    const response = await listCohortTracking('demo-cohorte-b', all());

    expect(response).toMatchObject({ total: 22, offset: 0, limit: 50 });
    expect(codes(response).slice(0, 6)).toEqual(['PART-0001', 'PART-0002', 'PART-0003', 'PART-0004', 'PART-0005', 'PART-0006']);
    expect(interpretTrackingResponse(response).outcome).toBe(TRACKING_OUTCOME.OK);
    expect(http.fetchCohortParticipantIndicators).not.toHaveBeenCalled();
  });

  it('nivel como categoría y adherencia como fracción; sin perfil, null', async () => {
    enableDemo();
    const { entries } = interpretTrackingResponse(await listCohortTracking('demo-cohorte-b', all()));
    const byCode = Object.fromEntries(entries.map((entry) => [entry.code, entry]));

    expect(byCode['PART-0001']).toMatchObject({ progressLevel: 'COMPLETADO', adherence: 0.91, activeAlertCount: 0 });
    expect(byCode['PART-0005']).toMatchObject({ progressLevel: null, adherence: null, activeAlertCount: 0 });
    expect(entries.every(({ progressLevel }) => progressLevel === null || PROGRESS_LEVELS.includes(progressLevel))).toBe(true);
  });

  it('una cohorte sin participantes: lista vacía con el mensaje del backend', async () => {
    enableDemo();

    expect(await listCohortTracking('demo-cohorte-a', all())).toMatchObject({ total: 0, items: [], mensaje: expect.any(String) });
  });

  it('una cohorte inexistente: 404 COHORTE_NO_ENCONTRADA', async () => {
    enableDemo();

    await expect(listCohortTracking('no-existe', all())).rejects.toMatchObject({ status: 404, codigo: 'COHORTE_NO_ENCONTRADA' });
  });

  it('sigue las asociaciones actuales y un participante sin perfil aparece sin indicadores', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');
    const created = await createCohort({ name: 'Cohorte X', startDate: '2026-08-03', endDate: '2026-11-27', scheduleId: 'demo-cronograma-3' });
    await assignParticipants(created.id, ['demo-candidato-11']);

    expect(codes(await listCohortTracking('demo-cohorte-b', all()))).not.toContain('PART-0003');
    expect((await listCohortTracking(created.id, all())).items[0]).toMatchObject({
      codigo_participante: 'PART-0011', nivel_progreso: null, tasa_adherencia: null, alertas_activas: 0,
    });
  });

  it('incluye campos adicionales que la interfaz descarta', async () => {
    enableDemo();
    const response = await listCohortTracking('demo-cohorte-b', all());

    expect(Object.keys(response.items[0])).toEqual(expect.arrayContaining(['id_usuario', 'correo']));
    expect(JSON.stringify(interpretTrackingResponse(response))).not.toMatch(/demo-participante|@/);
  });
});

describe('Demostración: filtros, orden y paginación con la política del backend', () => {
  const list = async (query) => interpretTrackingResponse(await listCohortTracking('demo-cohorte-b', all(query))).entries;

  it('filtros combinados: nivel, rango de adherencia y alertas', async () => {
    enableDemo();
    const query = withFilter(withFilter(withFilter(INITIAL_TRACKING_QUERY, 'adherenceMin', '50'), 'adherenceMax', '75'), 'alerts', 'false');
    const entries = await list(query);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(({ adherence, activeAlertCount }) => adherence >= 0.5 && adherence <= 0.75 && activeAlertCount === 0)).toBe(true);
    expect((await list(withFilter(INITIAL_TRACKING_QUERY, 'level', 'COMPLETADO'))).every(({ progressLevel }) => progressLevel === 'COMPLETADO')).toBe(true);
    expect((await list(withFilter(INITIAL_TRACKING_QUERY, 'alerts', 'true'))).map(({ code }) => code)).toEqual(['PART-0002', 'PART-0004', 'PART-0006']);
  });

  it('con un rango de adherencia, los participantes sin dato quedan fuera', async () => {
    enableDemo();

    expect((await list(withFilter(INITIAL_TRACKING_QUERY, 'adherenceMin', '25'))).some(({ adherence }) => adherence === null)).toBe(false);
  });

  it('orden por nivel canónico y por adherencia, sin dato siempre al final, desempate por código', async () => {
    enableDemo();
    const byLevel = await list(withSort(INITIAL_TRACKING_QUERY, valueToSort('nivel_progreso:DESC')));
    const ranks = byLevel.map(({ progressLevel }) => (progressLevel === null ? -1 : PROGRESS_LEVELS.indexOf(progressLevel)));
    const known = ranks.filter((rank) => rank >= 0);

    expect(known).toEqual([...known].sort((a, b) => b - a));
    expect(ranks.at(-1)).toBe(-1);

    const byAdherence = (await list(withSort(INITIAL_TRACKING_QUERY, valueToSort('tasa_adherencia:ASC')))).map(({ adherence }) => adherence);
    const present = byAdherence.filter((value) => value !== null);
    expect(present).toEqual([...present].sort((a, b) => a - b));
    expect(byAdherence.at(-1)).toBeNull();
  });

  it('pagina con offset y limit, informando el total', async () => {
    enableDemo();
    const first = await listCohortTracking('demo-cohorte-b', { ...INITIAL_TRACKING_QUERY, limit: 5 });
    const second = await listCohortTracking('demo-cohorte-b', { ...withPage(INITIAL_TRACKING_QUERY, 1, 22), offset: 5, limit: 5 });

    expect(first).toMatchObject({ total: 22, offset: 0, limit: 5 });
    expect(first.items).toHaveLength(5);
    expect(codes(second)).toEqual(['PART-0006', 'PART-0015', 'PART-0016', 'PART-0017', 'PART-0018']);
  });
});

describe('Escenarios del listado en la demostración', () => {
  it('denegado: 403 sin datos', async () => {
    enableDemo('denegado');

    await expect(listCohortTracking('demo-cohorte-b', all())).rejects.toMatchObject({ status: 403 });
  });

  it.each(['registro-ajeno', 'respuesta-ajena'])('%s: respuesta mezclada que la interfaz no presenta', async (scenario) => {
    enableDemo(scenario);

    expect(interpretTrackingResponse(await listCohortTracking('demo-cohorte-b', all()))).toEqual({ outcome: TRACKING_OUTCOME.INVALID });
  });

  it('error: 500 sin datos de reemplazo', async () => {
    enableDemo('error');

    await expect(listCohortTracking('demo-cohorte-b', all())).rejects.toMatchObject({ status: 500 });
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      listCohortTracking('demo-cohorte-b', all()).then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });
});
