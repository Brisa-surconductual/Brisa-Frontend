import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { TrackingEntryCard } from '../../components/TrackingEntryCard/index.js';
import { TrackingTable } from '../../components/TrackingTable/index.js';
import { applyTrackingQuery } from '../../data/trackingDemoQuery.js';
import { listCohortTracking } from '../../data/trackingSource.js';
import { effectiveSort, parseTrackingSearch } from '../../services/trackingQuery.js';
import { interpretTrackingResponse } from '../../services/trackingResponse.js';
import { PROGRESS_LEVELS } from '../../types/participantTracking.js';
import { getParticipantTrackingPath } from '../../utils/cohortRoutes.js';

/*
 * Rendimiento del FRONTEND de RF-142 con TRANSPORTE SIMULADO (500
 * participantes). Mide, por consulta: la fuente real en modo API →
 * apiClient simulado (filtra, ordena y pagina 500 filas con la misma
 * política que el backend) → validación del contrato → render de la
 * tabla y de las tarjetas. Excluye la red, el backend, M05, la base de
 * datos y el pintado del navegador: no demuestra que el backend cumpla
 * los 2 s. El rendimiento HTTP del backend y el integrado se miden aparte
 * (ver el SDD, nota de cierre de RF-142).
 */
vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const PARTICIPANTS = 500;
const WARMUP = 5;
const RUNS = 30;
const P95_LIMIT_MS = 2000;

const TYPES = ['INACTIVIDAD', 'CRAVING_ELEVADO'];

// 500 filas deterministas con la forma real; incluye indicadores nulos.
const ROWS = Object.freeze(
  Array.from({ length: PARTICIPANTS }, (_, index) => {
    const active = index % 7 === 0 ? 2 : index % 5 === 0 ? 1 : 0;

    return Object.freeze({
      codigo_participante: `P-${(0x10000000 + index * 7919).toString(16).toUpperCase().slice(-8)}`,
      nivel_progreso: index % 23 === 0 ? null : PROGRESS_LEVELS[index % PROGRESS_LEVELS.length],
      tasa_adherencia: index % 29 === 0 ? null : (index * 37) % 101 / 100,
      alertas_activas: active,
      alertas_atendidas: index % 3,
      tipos_alerta_activa: TYPES.slice(0, active),
    });
  }),
);

// Parámetros reales → consulta de la emulación (que trabaja en %).
function queryFromParams(params) {
  const percent = (value) => (value === undefined ? null : Math.round(value * 100));

  return {
    filters: {
      level: params.nivel_progreso ?? null,
      adherenceMin: percent(params.adherencia_min),
      adherenceMax: percent(params.adherencia_max),
      alerts: params.con_alertas ?? null,
    },
    sort: params.orden_campo ? { field: params.orden_campo, direction: params.orden_direccion } : null,
    offset: params.offset,
    limit: params.limit,
  };
}

const SCENARIOS = Object.freeze([
  ['consulta inicial', ''],
  ['filtros combinados y orden DESC', 'nivel=EN_AVANCE&adherencia_min=25&adherencia_max=75&alertas=true&orden=tasa_adherencia&direccion=DESC'],
  ['orden por nivel ASC, página 5', 'orden=nivel_progreso&direccion=ASC&pagina=5'],
  ['última página (25)', 'pagina=25'],
]);

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function measure(search) {
  const query = parseTrackingSearch(search);
  const start = performance.now();

  const result = interpretTrackingResponse(await listCohortTracking(COHORT, query));
  const rows = result.entries.map((entry) => ({ entry, detailPath: getParticipantTrackingPath(COHORT, entry.code) }));
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <TrackingTable rows={rows} sort={effectiveSort(query.sort)} onSort={() => {}} />
      <ol>
        {rows.map(({ entry, detailPath }) => (
          <li key={entry.code}><TrackingEntryCard entry={entry} detailPath={detailPath} /></li>
        ))}
      </ol>
    </MemoryRouter>,
  );

  return { ms: performance.now() - start, result, html };
}

const report = [];

beforeEach(() => {
  vi.stubEnv('VITE_M08_DEMO', '');
  apiClient.get.mockImplementation(async (_url, { params }) => {
    const { total, items } = applyTrackingQuery(ROWS, queryFromParams(params));
    return { status: 200, data: { items, total, offset: params.offset, limit: params.limit } };
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
  // Resultado reproducible en la salida de la prueba (datos sintéticos).
  console.info(`[RF-142 rendimiento frontend, transporte simulado, ${PARTICIPANTS} participantes]\n${report.join('\n')}`);
});

describe(`RF-142: rendimiento del frontend con ${PARTICIPANTS} participantes (transporte simulado)`, () => {
  it.each(SCENARIOS)(`%s: p95 ≤ ${P95_LIMIT_MS} ms en ${RUNS} mediciones`, async (name, search) => {
    for (let index = 0; index < WARMUP; index += 1) await measure(search);

    const samples = [];
    let last;
    for (let index = 0; index < RUNS; index += 1) {
      last = await measure(search);
      samples.push(last.ms);
    }

    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    const max = Math.max(...samples);
    report.push(`${name}: n=${RUNS}, p50=${p50.toFixed(2)} ms, p95=${p95.toFixed(2)} ms, máx=${max.toFixed(2)} ms, total=${last.result.total}, filas=${last.result.entries.length}`);

    expect(last.result.outcome).toBe('OK');
    expect(last.result.entries.length).toBeGreaterThan(0);
    expect(last.result.entries.length).toBeLessThanOrEqual(20);
    expect(last.html).toContain('<table');
    expect(p95).toBeLessThanOrEqual(P95_LIMIT_MS);
  });

  it('cada consulta es una sola petición GET con parámetros permitidos y página de 20', async () => {
    apiClient.get.mockClear();
    await measure(SCENARIOS[1][1]);

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    const [url, { params }] = apiClient.get.mock.calls[0];
    expect(url).toBe(`/admin/cohortes/${COHORT}/participantes/indicadores`);
    expect(params).toEqual({
      nivel_progreso: 'EN_AVANCE',
      adherencia_min: 0.25,
      adherencia_max: 0.75,
      con_alertas: 'true',
      orden_campo: 'tasa_adherencia',
      orden_direccion: 'DESC',
      offset: 0,
      limit: 20,
    });
  });
});
