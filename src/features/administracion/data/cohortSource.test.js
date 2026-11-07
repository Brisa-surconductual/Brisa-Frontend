import { afterEach, describe, expect, it, vi } from 'vitest';

import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import { DEMO_COHORTS } from './cohortDemoData.js';
import { DEMO_DELAY_MS, getCohortSourceMode, listCohorts } from './cohortSource.js';

function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_DEMO_SCENARIO', scenario);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('Fuente de datos de cohortes', () => {
  it('sin el modo de demostración, la integración está pendiente y no hay datos', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');

    expect(getCohortSourceMode()).toBe(COHORT_SOURCE_MODE.PENDING_INTEGRATION);
    await expect(listCohorts()).rejects.toThrow('no está integrada');
  });

  it('en producción nunca entrega datos ficticios, aunque exista la variable', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_M08_DEMO', 'true');

    expect(getCohortSourceMode()).toBe(COHORT_SOURCE_MODE.PENDING_INTEGRATION);
    await expect(listCohorts()).rejects.toThrow();
  });

  it('con el modo de demostración entrega las cohortes ficticias tras una espera', async () => {
    enableDemo();
    vi.useFakeTimers();

    expect(getCohortSourceMode()).toBe(COHORT_SOURCE_MODE.DEMO);
    const result = listCohorts();
    await vi.advanceTimersByTimeAsync(DEMO_DELAY_MS);

    await expect(result).resolves.toBe(DEMO_COHORTS);
  });

  it('escenario vacío: lista sin registros', async () => {
    enableDemo('vacio');
    vi.useFakeTimers();
    const result = listCohorts();
    await vi.advanceTimersByTimeAsync(DEMO_DELAY_MS);

    await expect(result).resolves.toEqual([]);
  });

  it('escenario de error: rechaza con un error identificado como simulado', async () => {
    enableDemo('error');
    vi.useFakeTimers();
    const result = listCohorts();
    const assertion = expect(result).rejects.toThrow('Error simulado del modo de demostración.');
    await vi.advanceTimersByTimeAsync(DEMO_DELAY_MS);

    await assertion;
  });

  it('escenario de carga: la consulta queda pendiente', async () => {
    enableDemo('carga');
    vi.useFakeTimers();
    const settled = vi.fn();
    listCohorts().then(settled, settled);
    await vi.advanceTimersByTimeAsync(DEMO_DELAY_MS * 10);

    expect(settled).not.toHaveBeenCalled();
  });
});
