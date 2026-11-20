import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEMO_SCENARIO_VARIABLES, resetDemoScenarios } from './demoScenarioTestEnv.js';

const UTILS = join(dirname(fileURLToPath(import.meta.url)), '..', 'utils');

afterEach(() => vi.unstubAllEnvs());

describe('Aislamiento de las pruebas frente al .env.local', () => {
  it('restablece todas las variables de escenario que leen los utilitarios del M08', () => {
    const used = new Set();
    for (const file of readdirSync(UTILS).filter((name) => /Scenario\.js$/.test(name))) {
      for (const [name] of readFileSync(join(UTILS, file), 'utf8').matchAll(/VITE_M08_[A-Z_]+_SCENARIO/g)) used.add(name);
    }

    expect([...used].sort()).toEqual([...DEMO_SCENARIO_VARIABLES].sort());
  });

  it('deja cada escenario vacío, que equivale al predeterminado', () => {
    vi.stubEnv('VITE_M08_PROFILE_SCENARIO', 'desactualizado');
    resetDemoScenarios(vi);

    for (const name of DEMO_SCENARIO_VARIABLES) expect(import.meta.env[name]).toBe('');
  });
});
