import { describe, expect, it, vi } from 'vitest';

import { crearCoordinadorSincronizacion } from './coordinadorSincronizacion.js';

/*
 * El coordinador con dependencias falsas: un reloj manual (sin
 * temporizadores reales) y un `sincronizar` guionizado.
 */
function crearReloj() {
  let ahora = 0;
  let siguienteId = 1;
  const tareas = new Map();

  return {
    ahora: () => ahora,
    setTimeout: (fn, ms) => {
      const id = siguienteId++;
      tareas.set(id, { fn, en: ahora + ms });
      return id;
    },
    clearTimeout: (id) => tareas.delete(id),
    setInterval: (fn, ms) => {
      const id = siguienteId++;
      tareas.set(id, { fn, en: ahora + ms, cada: ms });
      return id;
    },
    clearInterval: (id) => tareas.delete(id),
    pendientes: () => tareas.size,
    // Avanza el tiempo y ejecuta lo que venza.
    async avanzar(ms) {
      ahora += ms;
      for (const [id, tarea] of [...tareas]) {
        if (tarea.en > ahora) continue;
        if (tarea.cada) tarea.en += tarea.cada;
        else tareas.delete(id);
        tarea.fn();
      }
      await vaciar();
    },
  };
}

const vaciar = () => new Promise((resolve) => setTimeout(resolve, 0));

const r = (estado, extra = {}) => ({
  estado,
  pendientes: 2,
  conError: 0,
  error: null,
  reconciliacion: null,
  reintentar: false,
  falloDeRed: false,
  respondio: true,
  ...extra,
});

const FALLO = r('REINTENTO_PROGRAMADO', { reintentar: true });
const AL_DIA = r('AL_DIA', { pendientes: 0 });

function montar({ respuestas = [], conexion = () => true, config = {} } = {}) {
  const reloj = crearReloj();
  const guion = [...respuestas];
  const sincronizar = vi.fn(async () => guion.shift() ?? AL_DIA);
  const coordinador = crearCoordinadorSincronizacion({
    idUsuario: 'usuario-ficticio-a',
    transporte: { sincronizar: () => {} },
    conexionDisponible: conexion,
    reloj,
    config,
    sincronizar,
    listarSesiones: async () => ['sesion-1'],
  });
  return { reloj, sincronizar, coordinador };
}

const sesion = (coordinador) =>
  coordinador.obtenerEstado().sesiones['sesion-1'];

describe('reintentos con backoff', () => {
  it('programa 2 s, 4 s, 8 s… y al tener éxito vuelve a cero', async () => {
    const { reloj, sincronizar, coordinador } = montar({
      respuestas: [FALLO, FALLO, AL_DIA],
    });

    await coordinador.solicitar('INICIO_SESION');
    expect(sesion(coordinador)).toMatchObject({
      estado: 'REINTENTO_PROGRAMADO',
      intentosFallidos: 1,
      proximoIntentoEn: 2_000,
    });

    await reloj.avanzar(1_999);
    expect(sincronizar).toHaveBeenCalledTimes(1);
    await reloj.avanzar(1);
    expect(sincronizar).toHaveBeenCalledTimes(2);
    expect(sesion(coordinador)).toMatchObject({
      intentosFallidos: 2,
      proximoIntentoEn: 2_000 + 4_000,
    });

    await reloj.avanzar(4_000);
    expect(sincronizar).toHaveBeenCalledTimes(3);
    expect(sesion(coordinador)).toMatchObject({
      estado: 'AL_DIA',
      intentosFallidos: 0,
      proximoIntentoEn: null,
    });
  });

  it('el foco y el sondeo respetan la espera; la conexión no', async () => {
    const { sincronizar, coordinador } = montar({ respuestas: [FALLO] });

    await coordinador.solicitar('INICIO_SESION');
    await coordinador.solicitar('FOCO');
    await coordinador.solicitar('PERIODICO');
    expect(sincronizar).toHaveBeenCalledTimes(1);

    await coordinador.solicitar('CONEXION');
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it('agota los reintentos en vez de girar sin fin', async () => {
    const { reloj, sincronizar, coordinador } = montar({
      respuestas: Array(10).fill(FALLO),
      config: { maxReintentos: 2 },
    });

    await coordinador.solicitar('INICIO_SESION');
    await reloj.avanzar(2_000);
    await reloj.avanzar(4_000);
    expect(sesion(coordinador).estado).toBe('REINTENTOS_AGOTADOS');

    await reloj.avanzar(600_000);
    // Solo el sondeo podría disparar, y no reintenta una agotada.
    expect(sincronizar).toHaveBeenCalledTimes(3);
  });
});

describe('estados que esperan algo concreto', () => {
  it('401: solo un nuevo inicio de sesión (o manual) vuelve a intentar', async () => {
    const { sincronizar, coordinador } = montar({
      respuestas: [r('ESPERANDO_AUTENTICACION')],
    });

    await coordinador.solicitar('INICIO_SESION');
    for (const motivo of ['FOCO', 'PERIODICO', 'CONEXION'])
      await coordinador.solicitar(motivo);
    expect(sincronizar).toHaveBeenCalledTimes(1);

    await coordinador.solicitar('INICIO_SESION');
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it('LOTE_INVALIDO: no se reintenta solo, sí a mano', async () => {
    const { sincronizar, coordinador } = montar({
      respuestas: [r('LOTE_INVALIDO')],
    });

    await coordinador.solicitar('INICIO_SESION');
    await coordinador.solicitar('CONEXION');
    expect(sincronizar).toHaveBeenCalledTimes(1);

    await coordinador.solicitar('MANUAL');
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it('sin conexión no intenta y lo publica', async () => {
    let enLinea = false;
    const { sincronizar, coordinador } = montar({ conexion: () => enLinea });

    await coordinador.solicitar('INICIO_SESION');
    expect(sincronizar).not.toHaveBeenCalled();
    expect(coordinador.obtenerEstado().sinConexion).toBe(true);

    enLinea = true;
    await coordinador.solicitar('CONEXION');
    expect(sincronizar).toHaveBeenCalledTimes(1);
  });

  it('un fallo de red avisa al indicador; una respuesta lo limpia', async () => {
    const alFalloDeRed = vi.fn();
    const alRespuesta = vi.fn();
    const reloj = crearReloj();
    const guion = [
      r('INTERRUMPIDA', {
        reintentar: true,
        falloDeRed: true,
        respondio: false,
      }),
      AL_DIA,
    ];
    const coordinador = crearCoordinadorSincronizacion({
      idUsuario: 'u',
      transporte: { sincronizar: () => {} },
      reloj,
      alFalloDeRed,
      alRespuesta,
      sincronizar: async () => guion.shift(),
      listarSesiones: async () => ['sesion-1'],
    });

    await coordinador.solicitar('INICIO_SESION');
    expect(alFalloDeRed).toHaveBeenCalledTimes(1);
    await reloj.avanzar(2_000);
    expect(alRespuesta).toHaveBeenCalledTimes(1);
  });
});

describe('concurrencia y limpieza', () => {
  it('disparos durante una ejecución no la duplican: se agrupan en una repetición', async () => {
    let soltar;
    let enVuelo = 0;
    let maximo = 0;
    const sincronizar = vi.fn(async () => {
      enVuelo += 1;
      maximo = Math.max(maximo, enVuelo);
      await new Promise((resolve) => {
        soltar = resolve;
      });
      enVuelo -= 1;
      return AL_DIA;
    });
    const coordinador = crearCoordinadorSincronizacion({
      idUsuario: 'u',
      transporte: { sincronizar: () => {} },
      reloj: crearReloj(),
      sincronizar,
      listarSesiones: async () => ['sesion-1'],
    });

    const primera = coordinador.solicitar('INICIO_SESION');
    await vaciar();
    const otras = [
      coordinador.solicitar('FOCO'),
      coordinador.solicitar('MANUAL'),
      coordinador.solicitar('CONEXION'),
    ];
    expect(otras.every((p) => p === primera)).toBe(true);

    soltar();
    await primera;
    await vaciar();
    soltar();
    await vaciar();

    expect(sincronizar).toHaveBeenCalledTimes(2);
    expect(maximo).toBe(1);
  });

  it('dos coordinadores no sincronizan la misma sesión a la vez', async () => {
    let soltar;
    const lento = vi.fn(
      () =>
        new Promise((resolve) => {
          soltar = () => resolve(AL_DIA);
        }),
    );
    const rapido = vi.fn(async () => AL_DIA);
    const base = {
      idUsuario: 'u',
      transporte: { sincronizar: () => {} },
      reloj: crearReloj(),
      listarSesiones: async () => ['sesion-compartida'],
    };
    const uno = crearCoordinadorSincronizacion({ ...base, sincronizar: lento });
    const dos = crearCoordinadorSincronizacion({
      ...base,
      sincronizar: rapido,
    });

    const enCurso = uno.solicitar('INICIO_SESION');
    await vaciar();
    await dos.solicitar('INICIO_SESION');

    expect(rapido).not.toHaveBeenCalled();
    soltar();
    await enCurso;
  });

  it('detener corta el envío y limpia el sondeo y los reintentos', async () => {
    let senal;
    const reloj = crearReloj();
    const guion = [FALLO];
    const coordinador = crearCoordinadorSincronizacion({
      idUsuario: 'u',
      transporte: { sincronizar: () => {} },
      reloj,
      sincronizar: async (args) => {
        senal = args.senal;
        return guion.shift() ?? AL_DIA;
      },
      listarSesiones: async () => ['sesion-1'],
    });

    await coordinador.iniciar();
    expect(reloj.pendientes()).toBe(2); // sondeo de 60 s + reintento

    coordinador.detener();
    expect(senal.aborted).toBe(true);
    expect(reloj.pendientes()).toBe(0);
  });

  it('el sondeo de 60 s vuelve a intentar mientras haya pendientes', async () => {
    const { reloj, sincronizar, coordinador } = montar({
      respuestas: [r('PENDIENTE'), r('PENDIENTE')],
    });

    await coordinador.iniciar();
    await reloj.avanzar(60_000);

    expect(sincronizar).toHaveBeenCalledTimes(2);
    coordinador.detener();
  });

  it('sin transporte no se crea (producción)', () => {
    expect(() => crearCoordinadorSincronizacion({ idUsuario: 'u' })).toThrow();
  });
});
