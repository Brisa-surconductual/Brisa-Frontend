import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { SCHEDULE_STATUS } from '../types/scheduleStatus.js';
import { DEMO_COHORTS } from './cohortDemoData.js';
import { DEMO_DELAY_MS, resetDemoSource } from './cohortDemoSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import {
  changeCohortStatus,
  createCohort,
  getCohort,
  getCohortSourceMode,
  listCohorts,
  listSchedules,
  updateCohort,
} from './cohortSource.js';

// Tiempo real: el almacén se carga con import() dinámico, que no
// avanza con un reloj simulado. La espera de la demo es de 400 ms.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_DEMO_SCENARIO', scenario);
}

const NEW_COHORT = Object.freeze({
  name: 'Cohorte nueva',
  startDate: '2026-08-03',
  endDate: '2026-11-27',
  scheduleId: 'demo-cronograma-3',
});

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
});

afterEach(() => vi.unstubAllEnvs());

describe('Fuente de cohortes sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: integración pendiente y ninguna operación ficticia', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    expect(getCohortSourceMode()).toBe(COHORT_SOURCE_MODE.PENDING_INTEGRATION);
    for (const operation of [
      () => listCohorts(),
      () => getCohort('demo-cohorte-a'),
      () => listSchedules(),
      () => createCohort(NEW_COHORT),
      () => updateCohort('demo-cohorte-a', NEW_COHORT),
      () => changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE),
    ]) {
      await expect(operation()).rejects.toThrow('no está integrada');
    }
  });
});

describe('Fuente de cohortes en modo de demostración', () => {
  it('lista las cohortes ficticias tras la espera de la demostración', async () => {
    enableDemo();
    const start = Date.now();

    expect(getCohortSourceMode()).toBe(COHORT_SOURCE_MODE.DEMO);
    expect(await listCohorts()).toEqual(DEMO_COHORTS);
    expect(Date.now() - start).toBeGreaterThanOrEqual(DEMO_DELAY_MS - 20);
  });

  it('busca una cohorte por identificador y devuelve null si no existe', async () => {
    enableDemo();

    expect(await getCohort('demo-cohorte-b')).toEqual(DEMO_COHORTS[1]);
    expect(await getCohort('no-existe')).toBeNull();
  });

  it('crea en BORRADOR, con identificador temporal y el nombre del cronograma', async () => {
    enableDemo();
    const created = await createCohort(NEW_COHORT);

    expect(created).toEqual({
      ...NEW_COHORT,
      id: 'demo-temporal-1',
      status: COHORT_STATUS.DRAFT,
      scheduleName: 'Cronograma demostrativo 3',
    });
    expect(Object.isFrozen(created)).toBe(true);
    expect(await listCohorts()).toEqual([...DEMO_COHORTS, created]);
    expect((await createCohort(NEW_COHORT)).id).toBe('demo-temporal-2');
  });

  it('edita los campos del formulario sin cambiar el estado ni mutar los iniciales', async () => {
    enableDemo();
    const original = DEMO_COHORTS[1];
    const updated = await updateCohort(original.id, NEW_COHORT);

    expect(updated).toMatchObject({ ...NEW_COHORT, id: original.id, status: original.status });
    expect(await getCohort(original.id)).toEqual(updated);
    expect(DEMO_COHORTS[1]).toBe(original);
    expect(original.name).toBe('Cohorte Piloto B');
  });

  it('editar una cohorte inexistente devuelve null', async () => {
    enableDemo();

    expect(await updateCohort('no-existe', NEW_COHORT)).toBeNull();
  });

  it('los cambios persisten entre consultas (navegación) y se pierden al recargar', async () => {
    enableDemo();
    const created = await createCohort(NEW_COHORT);

    expect((await listCohorts()).map(({ id }) => id)).toContain(created.id);
    expect(await getCohort(created.id)).toEqual(created);

    resetDemoSource();

    expect(await listCohorts()).toEqual(DEMO_COHORTS);
    expect(await getCohort(created.id)).toBeNull();
  });

  it('entrega el catálogo de cronogramas con su estado', async () => {
    enableDemo();
    const schedules = await listSchedules();

    expect(schedules.map(({ status }) => status)).toContain(SCHEDULE_STATUS.ACTIVE);
    expect(schedules.map(({ status }) => status)).toContain(SCHEDULE_STATUS.INACTIVE);
  });

  it('escenario vacío: no hay cohortes, pero se puede crear', async () => {
    enableDemo('vacio');

    expect(await listCohorts()).toEqual([]);
    await createCohort(NEW_COHORT);
    expect(await listCohorts()).toHaveLength(1);
  });

  it('escenario sin cronogramas: ninguno está activo', async () => {
    enableDemo('sin-cronogramas');
    const schedules = await listSchedules();

    expect(schedules.length).toBeGreaterThan(0);
    expect(schedules.every(({ status }) => status === SCHEDULE_STATUS.INACTIVE)).toBe(true);
  });

  it('escenario de error: las consultas fallan con un error simulado', async () => {
    enableDemo('error');

    await expect(listCohorts()).rejects.toThrow('Error simulado del modo de demostración.');
    await expect(getCohort('demo-cohorte-a')).rejects.toThrow('Error simulado');
  });

  it('escenario de error al guardar: crear y editar fallan sin cambiar nada', async () => {
    enableDemo('error-guardado');

    await expect(createCohort(NEW_COHORT)).rejects.toThrow('Error simulado al guardar');
    await expect(updateCohort('demo-cohorte-a', NEW_COHORT)).rejects.toThrow('Error simulado al guardar');
    expect(await listCohorts()).toEqual(DEMO_COHORTS);
  });

  it('escenario de carga: la consulta queda pendiente', async () => {
    enableDemo('carga');
    const settled = vi.fn();
    listCohorts().then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS * 2));

    expect(settled).not.toHaveBeenCalled();
  });
});

describe('Cambio de estado en modo de demostración', () => {
  it('activar una cohorte en borrador se refleja en el listado y persiste hasta recargar', async () => {
    enableDemo();
    const result = await changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE);

    expect(result).toMatchObject({ ok: true, cohort: { id: 'demo-cohorte-a', status: COHORT_STATUS.ACTIVE } });
    expect((await getCohort('demo-cohorte-a')).status).toBe(COHORT_STATUS.ACTIVE);
    expect(DEMO_COHORTS[0].status).toBe(COHORT_STATUS.DRAFT);

    resetDemoSource();
    expect((await getCohort('demo-cohorte-a')).status).toBe(COHORT_STATUS.DRAFT);
  });

  it('inactivar una cohorte activa', async () => {
    enableDemo();

    expect(await changeCohortStatus('demo-cohorte-b', COHORT_TRANSITION.INACTIVATE)).toMatchObject({
      ok: true, cohort: { status: COHORT_STATUS.INACTIVE },
    });
  });

  it('una cohorte inactiva no puede reactivarse', async () => {
    enableDemo();

    expect(await changeCohortStatus('demo-cohorte-c', COHORT_TRANSITION.ACTIVATE)).toMatchObject({
      ok: false, reason: 'NOT_ALLOWED', cohort: { status: COHORT_STATUS.INACTIVE },
    });
  });

  it('escenario de activación bloqueada: el cronograma ya no está activo', async () => {
    enableDemo('activacion-bloqueada');

    expect(await changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE)).toMatchObject({
      ok: false,
      message: 'No es posible activar la cohorte porque el cronograma asociado no está activo.',
    });
    expect((await getCohort('demo-cohorte-a')).status).toBe(COHORT_STATUS.DRAFT);
  });

  it('escenario de error al guardar: el cambio de estado falla sin cambios parciales', async () => {
    enableDemo('error-guardado');

    await expect(changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE)).rejects.toThrow('Error simulado');
    expect(await listCohorts()).toEqual(DEMO_COHORTS);
  });
});
