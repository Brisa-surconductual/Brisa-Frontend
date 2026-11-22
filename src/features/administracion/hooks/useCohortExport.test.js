import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXPORT_ERROR,
  EXPORT_SOURCE_MODE,
  EXPORT_STATUS as ST,
} from '../types/cohortExport.js';
import { useCohortExport } from './useCohortExport.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial con
 * un setter espía; useRef es un objeto simple compartido por la prueba.
 */
const react = vi.hoisted(() => ({ setters: [], ref: { current: false } }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    react.setters.push(setter);
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useRef() {
    return react.ref;
  },
}));

// Orden de los useState del hook.
const STATE = 1;
const lastState = () => react.setters[STATE].mock.calls.at(-1)?.[0];

const FILE = Object.freeze({
  fileName: 'indicadores_cohorte_activa_20261122.csv',
  content: 'a\r\n1\r\n',
  sizeBytes: 6,
  notificationsAvailable: true,
  behavioralStale: false,
});

function source(changes = {}) {
  return {
    getMode: () => EXPORT_SOURCE_MODE.DEMO,
    exportCsv: vi.fn().mockResolvedValue(FILE),
    download: vi.fn(),
    ...changes,
  };
}

beforeEach(() => {
  react.setters = [];
  react.ref = { current: false };
});

describe('useCohortExport (RF-144)', () => {
  it('genera el archivo de la cohorte e inicia la descarga', async () => {
    const fuente = source();
    await useCohortExport({ cohortId: 'co-1', source: fuente }).exportCsv();

    expect(fuente.exportCsv).toHaveBeenCalledWith('co-1');
    expect(fuente.download).toHaveBeenCalledWith(FILE);
    expect(react.setters[STATE].mock.calls[0][0].status).toBe(ST.EXPORTING);
    expect(lastState()).toEqual({ status: ST.STARTED, file: FILE });
  });

  it.each([
    [EXPORT_ERROR.FORBIDDEN, ST.FORBIDDEN],
    [EXPORT_ERROR.COHORT_NOT_ACTIVE, ST.COHORT_NOT_ACTIVE],
    [EXPORT_ERROR.NO_INDICATORS, ST.NO_INDICATORS],
    [EXPORT_ERROR.GENERATION_FAILED, ST.GENERATION_FAILED],
    [EXPORT_ERROR.AUDIT_UNAVAILABLE, ST.AUDIT_UNAVAILABLE],
    ['OTRO', ST.GENERATION_FAILED],
  ])('rechazo %s: estado %s y ninguna descarga', async (code, status) => {
    const fuente = source({
      exportCsv: vi.fn().mockRejectedValue({ code }),
    });
    await useCohortExport({ cohortId: 'co-1', source: fuente }).exportCsv();

    expect(fuente.download).not.toHaveBeenCalled();
    expect(lastState()).toEqual({ status, file: null });
  });

  it('si el navegador no puede iniciar la descarga, no informa éxito', async () => {
    const fuente = source({
      download: vi.fn(() => {
        throw new Error('bloqueado');
      }),
    });
    await useCohortExport({ cohortId: 'co-1', source: fuente }).exportCsv();

    expect(lastState()).toEqual({ status: ST.DOWNLOAD_FAILED, file: null });
  });

  it('ignora una segunda activación mientras se genera el archivo', async () => {
    let resolve;
    const fuente = source({
      exportCsv: vi.fn(() => new Promise((done) => (resolve = done))),
    });
    const { exportCsv } = useCohortExport({ cohortId: 'co-1', source: fuente });

    const first = exportCsv();
    await exportCsv();
    resolve(FILE);
    await first;

    expect(fuente.exportCsv).toHaveBeenCalledTimes(1);
    expect(fuente.download).toHaveBeenCalledTimes(1);
    expect(react.ref.current).toBe(false);
  });

  it('con la integración pendiente no genera nada', async () => {
    const fuente = source({
      getMode: () => EXPORT_SOURCE_MODE.PENDING_INTEGRATION,
    });
    const result = useCohortExport({ cohortId: 'co-1', source: fuente });
    await result.exportCsv();

    expect(result.isIntegrationPending).toBe(true);
    expect(fuente.exportCsv).not.toHaveBeenCalled();
    expect(fuente.download).not.toHaveBeenCalled();
  });
});
