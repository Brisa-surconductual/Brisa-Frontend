import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDemoSource } from '../../../data/cohortDemoSource.js';
import { listCohorts } from '../../../data/cohortSource.js';
import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';
import {
  COHORT_FORM_LOAD_ERROR,
  COHORT_LIST_PATH,
  COHORT_SAVE_ERROR,
  useCohortFormPage,
} from './useCohortFormPage.js';

// React mínimo para entorno node: useState devuelve el valor fijado
// por índice (o el inicial) con un setter espía; useEffect se guarda
// para ejecutarlo a mano; useRef es un objeto simple.
const react = vi.hoisted(() => ({ values: {}, setters: [], effects: [], index: 0 }));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const index = react.index;
    react.index += 1;
    const setter = vi.fn();
    react.setters[index] = setter;
    const value = index in react.values ? react.values[index] : typeof initial === 'function' ? initial() : initial;
    return [value, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    return { current: initial };
  },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

// Orden de los useState del hook.
const S = Object.freeze({
  FORM: 1, SCHEDULES: 2, REPLACED: 3, STATUS: 4, LOADING: 5, LOAD_ERROR: 6,
  NOT_FOUND: 7, ERRORS: 8, SUBMITTING: 9, SUBMIT_ERROR: 10,
});

const SCHEDULES = Object.freeze([
  Object.freeze({ id: 's-activo', name: 'Activo', status: 'ACTIVO' }),
  Object.freeze({ id: 's-inactivo', name: 'Inactivo', status: 'INACTIVO' }),
]);
const VALID_FORM = Object.freeze({ name: '  Cohorte QA  ', startDate: '2026-02-02', endDate: '2026-05-29', scheduleId: 's-activo' });
const COHORT = Object.freeze({ id: 'c-9', name: 'Cohorte nueve', startDate: '2026-01-05', endDate: '2026-04-30', scheduleId: 's-activo', status: 'ACTIVA' });

function makeSource(overrides = {}) {
  return {
    getMode: () => COHORT_SOURCE_MODE.DEMO,
    getCohort: vi.fn().mockResolvedValue(COHORT),
    listSchedules: vi.fn().mockResolvedValue(SCHEDULES),
    create: vi.fn().mockImplementation(async (values) => ({ ...values, id: 'demo-temporal-1', status: 'BORRADOR' })),
    update: vi.fn().mockImplementation(async (id, values) => ({ ...COHORT, ...values, id })),
    ...overrides,
  };
}

// Auxiliar de prueba: invoca el hook (recibido como valor, igual que
// renderDirect en users) con el estado fijado por índice.
function renderHookWith(hook, args, values = {}) {
  react.values = values;
  react.setters = [];
  react.effects = [];
  react.index = 0;
  return hook(args);
}

const run = (args, values) => renderHookWith(useCohortFormPage, args, values);

function submitEvent() {
  const focus = vi.fn();
  return {
    focus,
    event: { preventDefault: vi.fn(), currentTarget: { elements: { namedItem: (name) => ({ name, focus: () => focus(name) }) } } },
  };
}

beforeEach(() => navigate.mockReset());

describe('Creación de cohorte', () => {
  it('una cohorte válida se crea con el nombre normalizado y vuelve al listado con aviso', async () => {
    const source = makeSource();
    const { handleSubmit } = run({ source }, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: SCHEDULES });

    await handleSubmit(submitEvent().event);

    expect(source.create).toHaveBeenCalledWith({
      name: 'Cohorte QA', startDate: '2026-02-02', endDate: '2026-05-29', scheduleId: 's-activo',
    });
    expect(source.update).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(COHORT_LIST_PATH, {
      state: { cohortNotice: { action: 'create', name: 'Cohorte QA' } },
    });
  });

  it.each([
    ['nombre vacío', { name: '' }, 'name', 'El nombre de la cohorte es obligatorio.'],
    ['nombre solo con espacios', { name: '   ' }, 'name', 'El nombre de la cohorte es obligatorio.'],
    ['sin fecha de inicio', { startDate: '' }, 'startDate', 'La fecha de inicio del programa es obligatoria.'],
    ['fecha de inicio inválida', { startDate: '2026-02-30' }, 'startDate', 'Ingresa una fecha de inicio válida.'],
    ['sin fecha de finalización', { endDate: '' }, 'endDate', 'La fecha de finalización del programa es obligatoria.'],
    ['fechas fuera de orden', { startDate: '2026-05-30', endDate: '2026-05-29' }, 'endDate', 'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.'],
    ['sin cronograma', { scheduleId: '' }, 'scheduleId', 'Selecciona el cronograma asociado.'],
    ['cronograma inactivo', { scheduleId: 's-inactivo' }, 'scheduleId', 'La cohorte debe asociarse a un cronograma psicoeducativo activo.'],
  ])('%s: no guarda, muestra el error y enfoca el campo', async (_, change, field, message) => {
    const source = makeSource();
    const { handleSubmit } = run({ source }, { [S.FORM]: { ...VALID_FORM, ...change }, [S.SCHEDULES]: SCHEDULES });
    const { event, focus } = submitEvent();

    await handleSubmit(event);

    expect(source.create).not.toHaveBeenCalled();
    expect(react.setters[S.ERRORS]).toHaveBeenCalledWith(expect.objectContaining({ [field]: message }));
    expect(focus).toHaveBeenCalledWith(field);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('acepta una fecha de inicio igual a la final', async () => {
    const source = makeSource();
    const { handleSubmit } = run({ source }, {
      [S.FORM]: { ...VALID_FORM, startDate: '2026-05-29', endDate: '2026-05-29' }, [S.SCHEDULES]: SCHEDULES,
    });

    await handleSubmit(submitEvent().event);
    expect(source.create).toHaveBeenCalledTimes(1);
  });

  it('sin cronogramas activos no permite completar el flujo', async () => {
    const source = makeSource();
    const result = run({ source }, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: [SCHEDULES[1]] });

    expect(result.hasActiveSchedules).toBe(false);
    expect(result.scheduleOptions).toEqual([]);
    await result.handleSubmit(submitEvent().event);
    expect(source.create).not.toHaveBeenCalled();
  });

  it('solo ofrece cronogramas activos como opciones', () => {
    expect(run({ source: makeSource() }, { [S.SCHEDULES]: SCHEDULES }).scheduleOptions).toEqual([
      { value: 's-activo', label: 'Activo' },
    ]);
  });

  it('un error al guardar se informa y no navega', async () => {
    const source = makeSource({ create: vi.fn().mockRejectedValue(new Error('x')) });
    const { handleSubmit } = run({ source }, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: SCHEDULES });

    await handleSubmit(submitEvent().event);

    expect(react.setters[S.SUBMIT_ERROR]).toHaveBeenLastCalledWith(COHORT_SAVE_ERROR);
    expect(react.setters[S.SUBMITTING]).toHaveBeenLastCalledWith(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('un doble envío solo guarda una vez', async () => {
    let resolve;
    const source = makeSource({ create: vi.fn(() => new Promise((done) => { resolve = done; })) });
    const { handleSubmit } = run({ source }, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: SCHEDULES });

    const first = handleSubmit(submitEvent().event);
    await handleSubmit(submitEvent().event);
    resolve({ ...VALID_FORM, id: 'demo-temporal-1' });
    await first;

    expect(source.create).toHaveBeenCalledTimes(1);
  });

  it('cancelar vuelve al listado sin guardar', () => {
    const source = makeSource();
    run({ source }, { [S.FORM]: VALID_FORM }).handleCancel();

    expect(navigate).toHaveBeenCalledWith(COHORT_LIST_PATH);
    expect(source.create).not.toHaveBeenCalled();
    expect(source.update).not.toHaveBeenCalled();
  });

  it('carga el catálogo de cronogramas sin pedir ninguna cohorte', async () => {
    const source = makeSource();
    run({ source });

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[S.SCHEDULES]).toHaveBeenCalledWith(SCHEDULES));
    expect(source.getCohort).not.toHaveBeenCalled();
  });
});

describe('Edición de cohorte', () => {
  const edit = (source, values) => run({ mode: 'edit', cohortId: 'c-9', source }, values);

  it('precarga los datos actuales y el estado de la cohorte', async () => {
    const source = makeSource();
    edit(source);

    react.effects[0]();
    await vi.waitFor(() =>
      expect(react.setters[S.FORM]).toHaveBeenCalledWith({
        name: 'Cohorte nueve', startDate: '2026-01-05', endDate: '2026-04-30', scheduleId: 's-activo',
      }),
    );
    expect(source.getCohort).toHaveBeenCalledWith('c-9');
    expect(react.setters[S.STATUS]).toHaveBeenCalledWith('ACTIVA');
    expect(react.setters[S.REPLACED]).toHaveBeenCalledWith(null);
  });

  it('si su cronograma ya no está activo, pide elegir otro y lo explica', async () => {
    const source = makeSource({ getCohort: vi.fn().mockResolvedValue({ ...COHORT, scheduleId: 's-inactivo' }) });
    edit(source);

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[S.REPLACED]).toHaveBeenCalledWith('Inactivo'));
    expect(react.setters[S.FORM]).toHaveBeenCalledWith(expect.objectContaining({ scheduleId: '' }));
  });

  it('identificador inexistente: recurso no encontrado', async () => {
    edit(makeSource({ getCohort: vi.fn().mockResolvedValue(null) }));

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[S.NOT_FOUND]).toHaveBeenLastCalledWith(true));
    expect(react.setters[S.FORM]).not.toHaveBeenCalled();
  });

  it('un fallo de carga es un error, no un formulario vacío', async () => {
    edit(makeSource({ listSchedules: vi.fn().mockRejectedValue(new Error('x')) }));

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[S.LOAD_ERROR]).toHaveBeenLastCalledWith(COHORT_FORM_LOAD_ERROR));
  });

  it('guardar actualiza la cohorte y vuelve al listado con aviso de edición', async () => {
    const source = makeSource();
    const { handleSubmit } = edit(source, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: SCHEDULES });

    await handleSubmit(submitEvent().event);

    expect(source.update).toHaveBeenCalledWith('c-9', expect.objectContaining({ name: 'Cohorte QA' }));
    expect(source.create).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(COHORT_LIST_PATH, {
      state: { cohortNotice: { action: 'edit', name: 'Cohorte QA' } },
    });
  });

  it('si la cohorte desapareció al guardar, muestra no encontrada sin navegar', async () => {
    const source = makeSource({ update: vi.fn().mockResolvedValue(null) });
    const { handleSubmit } = edit(source, { [S.FORM]: VALID_FORM, [S.SCHEDULES]: SCHEDULES });

    await handleSubmit(submitEvent().event);

    expect(react.setters[S.NOT_FOUND]).toHaveBeenCalledWith(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('Sin integración', () => {
  it('no consulta ni guarda nada', async () => {
    const source = makeSource({ getMode: () => COHORT_SOURCE_MODE.PENDING_INTEGRATION });
    const result = run({ source });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false });
    react.effects[0]();
    expect(source.listSchedules).not.toHaveBeenCalled();
    expect(source.getCohort).not.toHaveBeenCalled();
  });
});

describe('Flujo con la fuente de demostración real', () => {
  beforeEach(() => {
    resetDemoSource();
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'true');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('crear y luego editar se refleja en el listado', async () => {
    const schedules = [{ id: 'demo-cronograma-1', name: 'Cronograma demostrativo 1', status: 'ACTIVO' }];
    const form = { name: 'Cohorte flujo', startDate: '2026-09-07', endDate: '2026-12-04', scheduleId: 'demo-cronograma-1' };

    await run({}, { [S.FORM]: form, [S.SCHEDULES]: schedules }).handleSubmit(submitEvent().event);
    let cohorts = await listCohorts();
    const created = cohorts.find(({ name }) => name === 'Cohorte flujo');
    expect(created).toMatchObject({ status: 'BORRADOR', id: expect.stringMatching(/^demo-temporal-/) });

    await run({ mode: 'edit', cohortId: created.id }, {
      [S.FORM]: { ...form, name: 'Cohorte flujo editada' }, [S.SCHEDULES]: schedules,
    }).handleSubmit(submitEvent().event);
    cohorts = await listCohorts();
    expect(cohorts.find(({ id }) => id === created.id)).toMatchObject({ name: 'Cohorte flujo editada', status: 'BORRADOR' });
    expect(cohorts.filter(({ name }) => name.startsWith('Cohorte flujo'))).toHaveLength(1);
  });
});
