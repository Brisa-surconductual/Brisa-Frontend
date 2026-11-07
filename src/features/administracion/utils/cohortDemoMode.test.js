import { describe, expect, it } from 'vitest';

import { isCohortDemoEnabled } from './cohortDemoMode.js';
import { DEMO_SCENARIO, getDemoScenario } from './cohortDemoScenario.js';

describe('Activación del modo de demostración', () => {
  it.each([
    [{ DEV: true, VITE_M08_DEMO: 'true' }, true],
    [{ DEV: true }, false],
    [{ DEV: true, VITE_M08_DEMO: 'false' }, false],
    [{ DEV: true, VITE_M08_DEMO: 'TRUE' }, false],
    [{ DEV: true, VITE_M08_DEMO: '1' }, false],
    // Producción: nunca, aunque la variable exista.
    [{ DEV: false, VITE_M08_DEMO: 'true' }, false],
  ])('%j → %s', (env, expected) => expect(isCohortDemoEnabled(env)).toBe(expected));

  it('el escenario por defecto o desconocido es la lista', () => {
    expect(getDemoScenario({})).toBe(DEMO_SCENARIO.LIST);
    expect(getDemoScenario({ VITE_M08_DEMO_SCENARIO: 'otro' })).toBe(DEMO_SCENARIO.LIST);
  });

  it.each(Object.values(DEMO_SCENARIO))('reconoce el escenario %s', (scenario) =>
    expect(getDemoScenario({ VITE_M08_DEMO_SCENARIO: scenario })).toBe(scenario));
});
