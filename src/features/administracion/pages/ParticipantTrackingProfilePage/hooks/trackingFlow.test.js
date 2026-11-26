import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { getParticipantTrackingPath } from '../../../utils/cohortRoutes.js';
import { useParticipantTracking } from '../../ParticipantTrackingPage/hooks/useParticipantTracking.js';
import { PROFILE_STATUS, useParticipantTrackingProfile } from './useParticipantTrackingProfile.js';

/*
 * Recorrido completo en la API real (RF-142 → RF-128): hooks y fuente
 * reales, solo la red simulada. Comprueba qué peticiones salen, en qué
 * orden y con qué identificador, y que la ficha confirma el código que
 * luego usan las acciones (RF-38, RF-145).
 */
vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const react = vi.hoisted(() => ({ setters: [], effects: [] }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    react.setters.push(setter);
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    return { current: initial };
  },
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const CODE = 'P-7F3A91C2';

const LIST = Object.freeze({
  items: [
    {
      codigo_participante: CODE,
      nivel_progreso: 'EN_AVANCE',
      tasa_adherencia: 0.41,
      alertas_activas: 2,
      alertas_atendidas: 0,
      tipos_alerta_activa: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
    },
  ],
  total: 1,
  offset: 0,
  limit: 20,
});

const MEMBERS = Object.freeze([
  {
    codigo_participante: CODE,
    estado: 'ACTIVO',
    estado_registro: 'COMPLETO',
    estado_consentimiento: 'ACEPTADO',
    estado_linea_base: 'REGISTRADA',
    motivos_pendiente: [],
  },
]);

const PROFILE = Object.freeze({
  codigo_participante: CODE,
  indicadores_adherencia: { tasa_adherencia: 0.41, dias_con_registro: 10 },
  indicadores_progreso: { nivel_progreso: 'EN_AVANCE', unidades_completadas: 4 },
  tendencia_consumo: 'REDUCCION',
  alertas_activas: [],
  fecha_actualizacion: '2026-11-22T05:00:00Z',
  modo_consulta: 'SOLO_LECTURA',
});

function respond(routes) {
  apiClient.get.mockImplementation(async (url) => {
    const match = Object.entries(routes).find(([suffix]) => url.endsWith(suffix));
    if (!match) throw { response: { status: 404, data: { status: 404, codigo: 'NO_DEFINIDO' } } };
    const [, value] = match;
    if (value instanceof Error || value?.response) throw value;
    return value;
  });
}

async function runEffect(hook, args, effectIndex, loadingIndex) {
  react.setters = [];
  react.effects = [];
  hook(args);
  react.effects[effectIndex]();
  await vi.waitFor(() => expect(react.setters[loadingIndex]).toHaveBeenLastCalledWith(false));
}

const last = (index) => react.setters[index].mock.lastCall?.[0];

beforeEach(() => {
  vi.stubEnv('VITE_M08_DEMO', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Recorrido RF-142 → RF-128 en la API real', () => {
  it('el listado da el código auténtico y la ficha se abre con él, tras comprobar la pertenencia', async () => {
    respond({
      '/participantes/indicadores': { status: 200, data: LIST },
      [`/cohortes/${COHORT}/participantes`]: { status: 200, data: MEMBERS },
      [`/participantes/${CODE}/perfil-seguimiento`]: { status: 200, data: PROFILE },
    });

    // Listado: useState mode(0), query(1), cohort(2), page(3), loading(4)...; efecto 1 = consulta.
    await runEffect(useParticipantTracking, { cohortId: COHORT }, 1, 4);
    const [entry] = last(3).entries;
    expect(apiClient.get).toHaveBeenCalledWith(`/admin/cohortes/${COHORT}/participantes/indicadores`, {
      params: { offset: 0, limit: 20 },
      signal: expect.any(AbortSignal),
    });
    expect(getParticipantTrackingPath(COHORT, entry.code)).toBe(`/app/administrativo/cohortes/${COHORT}/seguimiento/${CODE}`);

    // Ficha: useState mode(0), cohort(1), code(2), profile(3), status(4), loading(5); efecto 2 = perfil.
    apiClient.get.mockClear();
    await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: entry.code }, 2, 5);

    expect(apiClient.get.mock.calls.map(([url]) => url)).toEqual([
      `/admin/cohortes/${COHORT}/participantes`,
      `/admin/participantes/${CODE}/perfil-seguimiento`,
    ]);
    expect(last(4)).toBe(PROFILE_STATUS.READY);
    expect(last(2)).toBe(CODE);
    expect(last(3)).toMatchObject({ progressLevel: 'EN_AVANCE', adherence: 0.41 });
  });

  it.each(['seg-k7m2q9', 'PART-0004', 'c0000000-0000-4000-8000-000000000009', 'persona@correo.com'])(
    'identificador falso en la URL (%s): ninguna petición y ningún dato',
    async (code) => {
      respond({});
      await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: code }, 2, 5);

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(last(4)).toBe(PROFILE_STATUS.INVALID_CODE);
      expect(last(2)).toBeNull();
    },
  );

  it('acceso directo por URL a un participante de otra cohorte: no se pide el perfil', async () => {
    respond({ [`/cohortes/${COHORT}/participantes`]: { status: 200, data: [{ ...MEMBERS[0], codigo_participante: 'P-00000001' }] } });
    await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: CODE }, 2, 5);

    expect(apiClient.get.mock.calls.map(([url]) => url)).toEqual([`/admin/cohortes/${COHORT}/participantes`]);
    expect(last(4)).toBe(PROFILE_STATUS.OUTSIDE_COHORT);
  });

  it('403 sin permiso individual: sin datos ni código confirmado', async () => {
    respond({
      [`/cohortes/${COHORT}/participantes`]: { status: 200, data: MEMBERS },
      [`/participantes/${CODE}/perfil-seguimiento`]: { response: { status: 403, data: { status: 403, codigo: 'SIN_PERMISO_INDIVIDUAL', mensaje: 'Sin permiso.' } } },
    });
    await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: CODE }, 2, 5);

    expect(last(4)).toBe(PROFILE_STATUS.DENIED);
    expect(last(2)).toBeNull();
    expect(last(3)).toBeNull();
  });

  it('204 sin perfil: código confirmado (para RF-145 y RF-38), sin indicadores', async () => {
    respond({
      [`/cohortes/${COHORT}/participantes`]: { status: 200, data: MEMBERS },
      [`/participantes/${CODE}/perfil-seguimiento`]: { status: 204, data: '' },
    });
    await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: CODE }, 2, 5);

    expect(last(4)).toBe(PROFILE_STATUS.NO_PROFILE);
    expect(last(2)).toBe(CODE);
    expect(last(3)).toBeNull();
  });

  it('nunca escribe: solo peticiones GET', async () => {
    respond({
      '/participantes/indicadores': { status: 200, data: LIST },
      [`/cohortes/${COHORT}/participantes`]: { status: 200, data: MEMBERS },
      [`/participantes/${CODE}/perfil-seguimiento`]: { status: 200, data: PROFILE },
    });
    await runEffect(useParticipantTracking, { cohortId: COHORT }, 1, 4);
    await runEffect(useParticipantTrackingProfile, { cohortId: COHORT, participantCode: CODE }, 2, 5);

    for (const method of ['post', 'put', 'patch', 'delete']) expect(apiClient[method]).not.toHaveBeenCalled();
  });
});
