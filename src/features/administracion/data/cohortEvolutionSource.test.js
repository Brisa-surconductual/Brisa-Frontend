import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  evolutionStatusFromError,
  interpretCohortEvolution,
} from '../services/cohortEvolutionResponse.js';
import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { EVOLUTION_STATUS as S } from '../types/cohortEvolution.js';
import {
  getCohortEvolution,
  getEvolutionSourceMode,
  getScheduleUnits,
} from './cohortEvolutionSource.js';
import { getCohort } from './cohortSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_EVOLUTION_SCENARIO', scenario);
}

async function view(cohortId = 'demo-cohorte-b', options) {
  const [catalog, response] = await Promise.all([
    getScheduleUnits(cohortId),
    getCohortEvolution(cohortId, options),
  ]);
  return interpretCohortEvolution(response, catalog, cohortId);
}

let fetchSpy;
let xhrSpy;

beforeEach(() => {
  resetDemoScenarios(vi);
  vi.stubEnv('VITE_M08_DEMO', '');
  transport.get.mockReset();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  xhrSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('XMLHttpRequest', xhrSpy);
});

afterEach(() => {
  // Las consultas pasan por el cliente HTTP simulado.
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Evolución temporal desde el backend (RF-141)', () => {
  const id = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
  const scheduleId = 'e8ad0743-eaf9-4288-83b3-697e89b1099d';
  const path = `/admin/cohortes/${id}`;
  const unitsPath = `/cronograma/obtener-unidades-temporales/${scheduleId}`;

  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])(
    '%s consulta el backend y usa los nombres oficiales',
    async (_, dev, flag) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('VITE_M08_DEMO', flag);

      transport.get
        .mockResolvedValueOnce({
          data: {
            id_cohorte: id,
            id_cronograma: scheduleId,
            nombre_cohorte: 'Cohorte RF-141',
            fecha_inicio_programa: '2026-11-01',
            fecha_fin_programa: '2026-11-30',
            estado: 'ACTIVA',
          },
        })
        .mockResolvedValueOnce({
          data: {
            id_cohorte: id,
            serie_unidades_temporales: ['u1', 'u2', 'u3'],
            serie_adherencia_promedio: [0, null, 0.75],
            serie_nivel_progreso_distribucion: [
              { INICIAL: 1 },
              {},
              { EN_AVANCE: 2 },
            ],
            serie_craving_promedio: [3, null, 0],
            unidades_con_datos_insuficientes: ['u2'],
            fecha_actualizacion: '2026-11-21T12:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          data: [
            {
              idUnidadTemporal: 'u3',
              nombreUnidadTemporal: 'Cierre',
              orden: 3,
            },
            {
              idUnidadTemporal: 'u1',
              nombreUnidadTemporal: 'Inicio',
              orden: 1,
            },
            {
              idUnidadTemporal: 'u2',
              nombreUnidadTemporal: 'Seguimiento',
              orden: 2,
            },
          ],
        });

      expect(getEvolutionSourceMode()).toBe(AGGREGATE_SOURCE_MODE.API);
      const cohort = await getCohort(id);
      const response = await getCohortEvolution(id);
      const catalog = await getScheduleUnits(id, cohort);
      const result = interpretCohortEvolution(response, catalog, id);

      expect(transport.get.mock.calls).toEqual([
        [path],
        [`${path}/evolucion`],
        [unitsPath],
      ]);
      expect(result).toMatchObject({ status: S.READY, hasGaps: true });
      expect(
        result.units.map(({ label, adherence, craving }) => [
          label,
          adherence,
          craving,
        ]),
      ).toEqual([
        ['Inicio', 0, 3],
        ['Seguimiento', null, null],
        ['Cierre', 0.75, 0],
      ]);
    },
  );

  it.each([
    [403, 'SIN_PERMISO', S.FORBIDDEN],
    [404, 'COHORTE_ACTIVA_NO_ENCONTRADA', S.NOT_FOUND],
    [500, 'ERROR_CONSTRUCCION_SERIE_TEMPORAL', S.ERROR],
    [503, 'SEGUIMIENTO_NO_DISPONIBLE', S.UNAVAILABLE],
  ])('interpreta HTTP %i %s', async (status, codigo, expected) => {
    transport.get.mockRejectedValueOnce({
      response: {
        status,
        data: {
          codigo,
          id_cohorte: id,
          estado_agregacion: 'ERROR_ACTUALIZACION',
          estado: 'DESACTUALIZADA',
          datos: { serie_adherencia_promedio: [0.3] },
        },
      },
    });
    await expect(
      getCohortEvolution(id).catch(evolutionStatusFromError),
    ).resolves.toBe(expected);
  });

  it('no consulta unidades de una cohorte distinta', async () => {
    await expect(
      getScheduleUnits(id, { id: 'otra-cohorte', scheduleId }),
    ).rejects.toThrow('cronograma');
    expect(transport.get).not.toHaveBeenCalled();
  });

  it('no presenta una serie general como filtrada mientras RF-135 está pendiente', async () => {
    await expect(
      getCohortEvolution(id, {
        filters: { modalidad_terapeutica: 'GRUPAL' },
      }),
    ).rejects.toThrow('filtros');
    expect(transport.get).not.toHaveBeenCalled();
  });
});

describe('Escenarios de demostración de la evolución (RF-141)', () => {
  it('disponible: cohortes distintas con series distintas', async () => {
    enableDemo();
    const b = await view('demo-cohorte-b');
    const c = await view('demo-cohorte-c');

    expect(b.status).toBe(S.READY);
    expect(b.units.map(({ label }) => label)).toEqual([
      'Semana 1',
      'Semana 2',
      'Semana 3',
      'Semana 4',
      'Semana 5',
      'Semana 6',
    ]);
    expect(b.units.at(-1).adherence).toBe(0.7342);
    expect(c.units.map(({ label }) => label)).toEqual([
      'Unidad 1',
      'Unidad 2',
      'Unidad 3',
      'Unidad 4',
    ]);
    expect(c.units[0].craving).toBe(4.9);
  });

  it('una unidad intermedia sin datos', async () => {
    enableDemo('unidad-sin-datos');
    const result = await view();

    expect(result.status).toBe(S.READY);
    expect(result.units.map(({ insufficient }) => insufficient)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(result.units[2]).toMatchObject({
      adherence: null,
      distribution: null,
    });
  });

  it('varias unidades sin datos', async () => {
    enableDemo('varias-sin-datos');
    expect(
      (await view()).units.filter(({ insufficient }) => insufficient),
    ).toHaveLength(3);
  });

  it.each([['una-unidad'], ['sin-unidades']])(
    '%s: estado funcional de menos de dos unidades',
    async (scenario) => {
      enableDemo(scenario);
      expect((await view()).status).toBe(S.INSUFFICIENT_UNITS);
    },
  );

  it('la Cohorte Piloto A solo tiene una unidad transcurrida', async () => {
    enableDemo();
    expect((await view('demo-cohorte-a')).status).toBe(S.INSUFFICIENT_UNITS);
  });

  it('ceros reales, distintos de null', async () => {
    enableDemo('ceros');
    const result = await view();

    expect(result.units[1]).toMatchObject({ adherence: 0, craving: 0 });
    expect(result.units[2]).toMatchObject({ adherence: null, craving: null });
  });

  it.each([
    ['m05-no-disponible', S.UNAVAILABLE, 'M05_UNAVAILABLE'],
    ['error-construccion', S.ERROR, 'SERIES_BUILD_ERROR'],
  ])('%s: rechazo sin serie parcial', async (scenario, _, code) => {
    enableDemo(scenario);
    await expect(getCohortEvolution('demo-cohorte-b')).rejects.toMatchObject({
      code,
    });
  });

  it('sin información: ninguna unidad con datos', async () => {
    enableDemo('sin-informacion');
    expect((await view()).status).toBe(S.NO_DATA);
  });

  it('series inconsistentes: no se presenta', async () => {
    enableDemo('series-inconsistentes');
    expect((await view()).status).toBe(S.ERROR);
  });

  it('filtros sin resultados: conserva los filtros aplicados', async () => {
    enableDemo('filtros-sin-resultados');
    const result = await view();

    expect(result.status).toBe(S.NO_FILTER_RESULTS);
    expect(result.filters.therapyModality).toBe('PERSONALIZADA');
  });

  it.each([
    ['sin-cohorte', 'COHORT_NOT_FOUND'],
    ['sin-permiso', 'FORBIDDEN'],
  ])('%s', async (scenario, code) => {
    enableDemo(scenario);
    await expect(getScheduleUnits('demo-cohorte-b')).rejects.toMatchObject({
      code,
    });
  });

  it('compatibilidad con RF-135: los filtros se reenvían a la fuente y vuelven como filtros_aplicados', async () => {
    enableDemo();
    const filters = { modalidad_terapeutica: 'GRUPAL' };
    const response = await getCohortEvolution('demo-cohorte-b', { filters });

    expect(response.filtros_aplicados).toEqual(filters);
    // La demostración no filtra datos en el navegador.
    expect(response.serie_adherencia_promedio).toEqual(
      (await getCohortEvolution('demo-cohorte-b')).serie_adherencia_promedio,
    );
  });
});

describe('Mock de la evolución fuera del build de producción (RF-141)', () => {
  const FEATURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );

  it('solo la fachada carga la demostración, con import() dinámico', () => {
    const importers = files(FEATURE_DIR)
      .filter((file) =>
        /cohortEvolutionDemo(Source|Data)|cohortEvolutionDemoScenario\.js/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map((file) => relative(FEATURE_DIR, file).split(sep).join('/'))
      .sort();

    expect(importers).toEqual([
      'data/cohortEvolutionDemoSource.js',
      'data/cohortEvolutionSource.js',
    ]);

    const facade = readFileSync(
      join(FEATURE_DIR, 'data/cohortEvolutionSource.js'),
      'utf8',
    );
    expect(facade).not.toMatch(/^import .*cohortEvolutionDemo/m);
    expect(facade).toMatch(
      /if \(!\(import\.meta\.env\.DEV && import\.meta\.env\.VITE_M08_DEMO === 'true'\)\) \{[\s\S]*?throw[\s\S]*?\}\s*return import\('\.\/cohortEvolutionDemoSource\.js'\);/,
    );
  });
});
