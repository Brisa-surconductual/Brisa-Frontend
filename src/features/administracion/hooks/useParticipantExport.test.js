import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PARTICIPANT_EXPORT_BLOCK as BLOCK,
  PARTICIPANT_EXPORT_ERROR as E,
  PARTICIPANT_EXPORT_SOURCE_MODE as MODE,
  PARTICIPANT_EXPORT_STATUS as S,
} from '../types/participantExport.js';

import { useParticipantExport } from './useParticipantExport.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial con
 * un setter espía; useRef es un objeto compartido por la prueba, como
 * entre renders; los efectos se guardan para ejecutarlos a mano.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], ref: { current: null } }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    react.setters.push(setter);
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useEffect(effect, deps) {
    react.effects.push({ effect, deps });
  },
  useRef() {
    return react.ref;
  },
}));

// Orden de los useState del hook: modo, estado.
const STATE = 1;
const states = () => react.setters.filter((_, index) => index % 2 === STATE).flatMap((setter) => setter.mock.calls.map(([value]) => value));
const lastState = () => states().at(-1);

const CODE = 'P-1A2B3C4D';
const FILE = Object.freeze({ fileName: 'seguimiento_individual_20261126.csv', blob: new Blob(['x']), sizeBytes: 1, unitCount: 1 });

function source(changes = {}) {
  return {
    getMode: () => MODE.API,
    exportCsv: vi.fn().mockResolvedValue(FILE),
    download: vi.fn(),
    ...changes,
  };
}

const render = (props = {}, hook = useParticipantExport) => hook({ participantCode: CODE, authentic: true, ...props });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
  react.ref = { current: null };
});

describe('useParticipantExport (RF-145): identidad y disponibilidad', () => {
  it('con un seudónimo A7 auténtico la acción está disponible', () => {
    const result = render({ source: source() });

    expect(result).toMatchObject({ code: CODE, blockedBy: null, canExport: true, dialogOpen: false, status: S.IDLE });
  });

  it('normaliza el seudónimo a mayúsculas', () => {
    expect(render({ participantCode: 'p-1a2b3c4d', source: source() }).code).toBe(CODE);
  });

  it.each([
    ['no declarado auténtico', { authentic: false }],
    ['referencia opaca de la ruta', { participantCode: 'seg-0001' }],
    ['código ficticio', { participantCode: 'PART-0015' }],
    ['UUID', { participantCode: 'c0000000-0000-4000-8000-000000000001' }],
    ['sin código', { participantCode: null }],
  ])('%s: identidad pendiente, sin petición', async (_, props) => {
    const fuente = source();
    const result = render({ source: fuente, ...props });

    expect(result).toMatchObject({ code: null, blockedBy: BLOCK.IDENTITY_PENDING, canExport: false });
    result.openDialog();
    await result.confirmExport();
    expect(states()).toEqual([]);
    expect(fuente.exportCsv).not.toHaveBeenCalled();
  });

  it('demostración: bloqueada aunque el código sea válido, sin petición', async () => {
    const fuente = source({ getMode: () => MODE.DEMO_UNAVAILABLE });
    const result = render({ source: fuente });

    expect(result).toMatchObject({ blockedBy: BLOCK.DEMO, canExport: false });
    result.openDialog();
    await result.confirmExport();
    expect(fuente.exportCsv).not.toHaveBeenCalled();
    expect(fuente.download).not.toHaveBeenCalled();
  });
});

describe('useParticipantExport (RF-145): confirmación', () => {
  it('abrir el modal no hace ninguna petición', () => {
    const fuente = source();
    render({ source: fuente }).openDialog();

    expect(lastState()).toEqual({ dialogOpen: true, status: S.IDLE, file: null });
    expect(fuente.exportCsv).not.toHaveBeenCalled();
  });

  it('cancelar cierra el modal sin ninguna petición', () => {
    const fuente = source();
    const result = render({ source: fuente });

    result.openDialog();
    result.cancelDialog();

    expect(lastState()).toEqual({ dialogOpen: false, status: S.IDLE, file: null });
    expect(fuente.exportCsv).not.toHaveBeenCalled();
  });

  it('confirmar: una única petición con el seudónimo y, con el archivo válido, la descarga', async () => {
    const fuente = source();
    await render({ source: fuente }).confirmExport();

    expect(fuente.exportCsv).toHaveBeenCalledTimes(1);
    expect(fuente.exportCsv).toHaveBeenCalledWith(CODE, { signal: expect.any(AbortSignal) });
    expect(fuente.download).toHaveBeenCalledWith(FILE);
    expect(states()[0]).toEqual({ dialogOpen: true, status: S.EXPORTING, file: null });
    expect(lastState()).toEqual({ dialogOpen: false, status: S.STARTED, file: FILE });
  });

  it('doble clic y confirmaciones concurrentes: una sola petición (una sola auditoría)', async () => {
    const pending = deferred();
    const fuente = source({ exportCsv: vi.fn(() => pending.promise) });
    const result = render({ source: fuente });

    const first = result.confirmExport();
    const second = result.confirmExport();
    result.openDialog();
    result.cancelDialog();
    pending.resolve(FILE);
    await Promise.all([first, second]);

    expect(fuente.exportCsv).toHaveBeenCalledTimes(1);
    expect(fuente.download).toHaveBeenCalledTimes(1);
    expect(states().filter(({ status }) => status === S.EXPORTING)).toHaveLength(1);
    expect(states().some(({ dialogOpen, status }) => !dialogOpen && status === S.IDLE)).toBe(false);
  });

  it('tras terminar se puede volver a exportar', async () => {
    const fuente = source();
    const result = render({ source: fuente });

    await result.confirmExport();
    await result.confirmExport();

    expect(fuente.exportCsv).toHaveBeenCalledTimes(2);
  });
});

describe('useParticipantExport (RF-145): errores', () => {
  it.each([
    [E.INVALID_CODE, S.INVALID_CODE],
    [E.SESSION_REQUIRED, S.SESSION_REQUIRED],
    [E.FORBIDDEN, S.FORBIDDEN],
    [E.NOT_FOUND, S.NOT_FOUND],
    [E.INCONSISTENT, S.INCONSISTENT],
    [E.NO_INDICATORS, S.NO_INDICATORS],
    [E.UNAVAILABLE, S.UNAVAILABLE],
    [E.ABORTED, S.ABORTED],
    [E.CONNECTION, S.CONNECTION],
    [E.INVALID_RESPONSE, S.INVALID_RESPONSE],
    ['OTRO', S.ABORTED],
  ])('%s → %s, sin descarga ni éxito', async (code, status) => {
    const fuente = source({ exportCsv: vi.fn().mockRejectedValue({ code }) });
    await render({ source: fuente }).confirmExport();

    expect(fuente.download).not.toHaveBeenCalled();
    expect(lastState()).toEqual({ dialogOpen: false, status, file: null });
    expect(states().some(({ status: value }) => value === S.STARTED)).toBe(false);
  });

  it('el navegador no inicia la descarga: no se informa éxito', async () => {
    const fuente = source({ download: vi.fn(() => { throw new Error('bloqueada'); }) });
    await render({ source: fuente }).confirmExport();

    expect(lastState()).toEqual({ dialogOpen: false, status: S.DOWNLOAD_FAILED, file: null });
  });
});

describe('useParticipantExport (RF-145): cancelación y cambio de participante', () => {
  it('la limpieza se vuelve a ejecutar al cambiar el código', () => {
    render({ source: source() });

    expect(react.effects[0].deps).toEqual([CODE]);
  });

  it.each([
    ['salir de la ficha', (pending) => pending.resolve(FILE)],
    ['cambiar de participante con un error tardío', (pending) => pending.reject({ code: E.FORBIDDEN })],
  ])('%s: aborta la petición y descarta su resultado', async (_, settle) => {
    const pending = deferred();
    const fuente = source({ exportCsv: vi.fn(() => pending.promise) });
    const result = render({ source: fuente });

    const running = result.confirmExport();
    const { signal } = fuente.exportCsv.mock.calls[0][1];
    react.effects[0].effect()();
    settle(pending);
    await running;

    expect(signal.aborted).toBe(true);
    expect(fuente.download).not.toHaveBeenCalled();
    expect(states()).toEqual([{ dialogOpen: true, status: S.EXPORTING, file: null }]);
    expect(react.ref.current).toBeNull();
  });
});
