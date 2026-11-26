import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACCION_ERROR_ENVIO_SOS,
  FASE_SOS,
  MOTIVO_FINALIZACION_SOS,
} from '../../types/sos.js';

import { crearControladorSos } from './controladorSos.js';

const ID_INT = 'a0000000-0000-4000-8000-000000000001';
const ID_SOS = 'b0000000-0000-4000-8000-000000000002';
const ID_PAUSADA = 'c0000000-0000-4000-8000-000000000003';
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function diferido() {
  let resolve;
  let reject;
  const promesa = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promesa, resolve, reject };
}

const apiError = (status, codigo, extra = {}) =>
  Object.freeze({
    status,
    codigo,
    mensaje: `mensaje ${codigo}`,
    campo: null,
    reintentable: status === null || status >= 500,
    ...extra,
  });

const SIN_CONEXION = apiError(null, 'SIN_CONEXION', { mensaje: '' });

const nodoSnake = (id, terminal = false, entrada = null) => ({
  id_nodo: id,
  tipo_nodo: 'MENSAJE',
  es_terminal: terminal,
  disponibilidad: { habilitado: true, habilita_aprox: null },
  bloques: [{ orden: 1, tipo: 'TEXTO', texto: `Texto ${id}` }],
  entrada,
});

const activacion = (cambios = {}) => ({
  id_intervencion: ID_INT,
  id_sesion_sos: ID_SOS,
  sesion_pausada: { id_sesion: ID_PAUSADA },
  inicio_servidor: '2026-11-20T04:40:00-05:00',
  fin_maximo_servidor: '2026-11-20T04:41:00-05:00',
  nodo_actual: nodoSnake('n1'),
  recursos_apoyo: [{ nombre: 'Línea 106', telefono: '106' }],
  contexto_origen: null,
  ...cambios,
});

const nodoGet = (id, terminal = false) => ({
  idSesion: ID_SOS,
  estadoSesion: terminal ? 'COMPLETADA' : 'ACTIVA',
  nodo: {
    idNodo: id,
    tipoNodo: 'MENSAJE',
    esTerminal: terminal,
    bloques: [{ orden: 1, tipo: 'TEXTO', texto: `Texto ${id}` }],
    entrada: null,
  },
});

const resultadoRespuesta = (secuencia, completada = false) => ({
  id_interaccion: 'x',
  secuencia,
  estado_sesion: completada ? 'COMPLETADA' : 'ACTIVA',
});

const finalizacion = (cambios = {}) => ({
  duracion_segundos: 15,
  estado: 'INCOMPLETA',
  sesion_pausada: { id_sesion: ID_PAUSADA, id_nodo_actual: 'nodo-pausado' },
  contexto_retorno: {
    modulo: 'CHAT',
    ruta: '/app/estudiante/chat',
    estado: null,
  },
  ...cambios,
});

function crearReloj({
  mono = 1000,
  epoch = Date.parse('2030-01-01T00:00:00Z'),
} = {}) {
  const reloj = {
    m: mono,
    e: epoch,
    mono: () => reloj.m,
    epoch: () => reloj.e,
    avanzar(ms) {
      reloj.m += ms;
      reloj.e += ms;
    },
  };
  return reloj;
}

let api;
let reloj;

beforeEach(() => {
  reloj = crearReloj();
  api = {
    activarSos: vi.fn().mockResolvedValue(activacion()),
    finalizarSos: vi.fn().mockResolvedValue(finalizacion()),
    enviarRespuesta: vi.fn().mockResolvedValue(resultadoRespuesta(1)),
    obtenerNodoActual: vi.fn().mockResolvedValue(nodoGet('n2')),
  };
});

async function enCurso(opciones = {}) {
  const c = crearControladorSos({ api, reloj, ...opciones });
  await c.activar();
  return c;
}

describe('activación (POST /chat/sos/activar)', () => {
  it('un solo POST con el contexto de origen; presenta el nodo y los recursos del backend', async () => {
    const contexto = {
      modulo: 'CHAT',
      ruta: '/app/estudiante/chat/sesion/x',
      estado: null,
    };
    const c = crearControladorSos({ api, reloj, contexto });

    expect(c.leer().fase).toBe(FASE_SOS.ACTIVANDO);
    const primera = c.activar();
    void c.activar();
    await primera;

    expect(api.activarSos).toHaveBeenCalledTimes(1);
    expect(api.activarSos).toHaveBeenCalledWith(contexto);
    const estado = c.leer();
    expect(estado.fase).toBe(FASE_SOS.EN_CURSO);
    expect(estado.nodo).toMatchObject({ idNodo: 'n1', esTerminal: false });
    expect(estado.nodo.bloques[0].texto).toBe('Texto n1');
    expect(estado.intervencion).toEqual({
      idIntervencion: ID_INT,
      idSesionSos: ID_SOS,
      sesionPausada: { idSesion: ID_PAUSADA },
      recursos: [{ nombre: 'Línea 106', telefono: '106' }],
    });
    expect(estado.restanteMs).toBe(60_000);
    expect(c.enCurso()).toBe(true);
  });

  it('sin sesión de terapia previa, sesionPausada es null (no se inventa)', async () => {
    api.activarSos.mockResolvedValue(activacion({ sesion_pausada: null }));
    const c = await enCurso();

    expect(c.leer().intervencion.sesionPausada).toBeNull();
  });

  it('una respuesta sin los datos del contrato no se presenta', async () => {
    api.activarSos.mockResolvedValue(
      activacion({ fin_maximo_servidor: 'no-es-fecha' }),
    );
    const c = await enCurso();

    expect(c.leer().fase).toBe(FASE_SOS.ERROR_ACTIVACION);
    expect(c.leer().error.codigo).toBe('RESPUESTA_INVALIDA');
    expect(c.leer().nodo).toBeNull();
  });

  it('401: pide volver a iniciar sesión', async () => {
    api.activarSos.mockRejectedValue(apiError(401, 'DESCONOCIDO'));
    const c = await enCurso();

    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.ERROR_ACTIVACION,
      requiereLogin: true,
    });
  });

  it.each([
    [403, 'CSRF_INVALIDO'],
    [404, 'SIN_FLUJO_SOS'],
    [409, 'INTERVENCION_EN_CURSO'],
  ])(
    '%s %s: error con el mensaje del backend y sin reintento automático',
    async (status, codigo) => {
      api.activarSos.mockRejectedValue(apiError(status, codigo));
      const c = await enCurso();

      expect(c.leer()).toMatchObject({
        fase: FASE_SOS.ERROR_ACTIVACION,
        error: { codigo, mensaje: `mensaje ${codigo}` },
        requiereLogin: false,
      });
      c.reintentarActivacion();
      expect(api.activarSos).toHaveBeenCalledTimes(1);
      expect(c.enCurso()).toBe(false);
    },
  );

  it('sin conexión: el reintento hace otro POST', async () => {
    api.activarSos.mockRejectedValueOnce(SIN_CONEXION);
    const c = await enCurso();

    expect(c.leer().fase).toBe(FASE_SOS.ERROR_ACTIVACION);
    c.reintentarActivacion();
    await flush();

    expect(api.activarSos).toHaveBeenCalledTimes(2);
    expect(c.leer().fase).toBe(FASE_SOS.EN_CURSO);
  });

  it('nodo inicial terminal: pide el cierre COMPLETADA (el backend decide el estado)', async () => {
    api.activarSos.mockResolvedValue(
      activacion({ nodo_actual: nodoSnake('n1', true) }),
    );
    await enCurso();
    await flush();

    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.COMPLETADA,
    );
  });
});

describe('cuenta regresiva con el límite del servidor', () => {
  it('se ancla al envío del POST: la latencia se descuenta', async () => {
    const respuesta = diferido();
    api.activarSos.mockReturnValue(respuesta.promesa);
    const c = crearControladorSos({ api, reloj });

    const activando = c.activar();
    reloj.avanzar(2_000);
    respuesta.resolve(activacion());
    await activando;

    expect(c.leer().restanteMs).toBe(58_000);
  });

  it('el desfase del reloj del dispositivo no cambia la duración', async () => {
    reloj = crearReloj({ epoch: Date.parse('1999-01-01T00:00:00Z') });
    const c = await enCurso();

    expect(c.leer().restanteMs).toBe(60_000);
  });

  it('pestaña oculta o equipo suspendido: cuenta el reloj de pared', async () => {
    const c = await enCurso();

    reloj.e += 30_000; // el monotónico no avanzó
    c.tick();

    expect(c.leer().restanteMs).toBe(30_000);
  });

  it('hora del equipo atrasada: cuenta el reloj monotónico', async () => {
    const c = await enCurso();

    reloj.e -= 3_600_000;
    reloj.m += 10_000;
    c.tick();

    expect(c.leer().restanteMs).toBe(50_000);
  });

  it('al agotarse pide TIEMPO_AGOTADO una sola vez y deja de admitir respuestas', async () => {
    const cierre = diferido();
    api.finalizarSos.mockReturnValue(cierre.promesa);
    const c = await enCurso();

    reloj.avanzar(60_000);
    c.tick();
    c.tick();
    c.responder({ valor: null });

    expect(api.finalizarSos).toHaveBeenCalledTimes(1);
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO,
    );
    expect(api.enviarRespuesta).not.toHaveBeenCalled();
    expect(c.leer().fase).toBe(FASE_SOS.FINALIZANDO);

    cierre.resolve(finalizacion({ estado: 'EXPIRADA', duracion_segundos: 60 }));
    await flush();
    expect(c.leer().resultado).toMatchObject({
      estado: 'EXPIRADA',
      duracionSegundos: 60,
    });
  });

  it('responder con el tiempo agotado (sin tick previo) cierra en lugar de enviar', async () => {
    const c = await enCurso();

    reloj.avanzar(61_000);
    c.responder({ valor: null });
    await flush();

    expect(api.enviarRespuesta).not.toHaveBeenCalled();
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO,
    );
  });
});

describe('respuestas (RF-30) en la sesión SOS', () => {
  it('envía el cuerpo RF-30 a la sesión SOS y luego pide el nodo actual', async () => {
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    const [idSesion, cuerpo] = api.enviarRespuesta.mock.calls[0];
    expect(idSesion).toBe(ID_SOS);
    expect(cuerpo).toEqual({
      id_interaccion: expect.stringMatching(UUID),
      id_nodo: 'n1',
      secuencia: 1,
      tipo_entrada: 'CONTINUAR',
      valor: null,
      timestamp_interaccion: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
      ),
      estado_conectividad: 'EN_LINEA',
      recursos_no_presentados: null,
    });
    expect(cuerpo).not.toHaveProperty('id_usuario');
    expect(api.obtenerNodoActual).toHaveBeenCalledWith(ID_SOS);
    expect(c.leer()).toMatchObject({ secuencia: 1, nodo: { idNodo: 'n2' } });
  });

  it('la siguiente respuesta lleva la secuencia siguiente y otro id_interaccion', async () => {
    api.enviarRespuesta
      .mockResolvedValueOnce(resultadoRespuesta(1))
      .mockResolvedValueOnce(resultadoRespuesta(2));
    api.obtenerNodoActual
      .mockResolvedValueOnce(nodoGet('n2'))
      .mockResolvedValueOnce(nodoGet('n3'));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();
    c.responder({ valor: null });
    await flush();

    const [, primero] = api.enviarRespuesta.mock.calls[0];
    const [, segundo] = api.enviarRespuesta.mock.calls[1];
    expect(segundo).toMatchObject({ id_nodo: 'n2', secuencia: 2 });
    expect(segundo.id_interaccion).not.toBe(primero.id_interaccion);
  });

  it('un doble toque mientras se envía no duplica la respuesta', async () => {
    const c = await enCurso();

    c.responder({ valor: null });
    c.responder({ valor: null });
    await flush();

    expect(api.enviarRespuesta).toHaveBeenCalledTimes(1);
  });

  it('al llegar al nodo final lo muestra y pide finalizar(COMPLETADA)', async () => {
    api.enviarRespuesta.mockResolvedValue(resultadoRespuesta(1, true));
    api.obtenerNodoActual.mockResolvedValue(nodoGet('final', true));
    api.finalizarSos.mockResolvedValue(
      finalizacion({ estado: 'COMPLETA', duracion_segundos: 48 }),
    );
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(c.leer().nodo.idNodo).toBe('final');
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.COMPLETADA,
    );
    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.FINALIZADA,
      resultado: { estado: 'COMPLETA', duracionSegundos: 48 },
    });
  });

  it('mostrar el nodo final no basta: el estado lo fija la respuesta de finalizar', async () => {
    api.enviarRespuesta.mockResolvedValue(resultadoRespuesta(1, true));
    api.obtenerNodoActual.mockResolvedValue(nodoGet('final', true));
    const cierre = diferido();
    api.finalizarSos.mockReturnValue(cierre.promesa);
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.FINALIZANDO,
      resultado: null,
    });
    // El backend puede responder INCOMPLETA aunque se pidió COMPLETADA.
    cierre.resolve(
      finalizacion({ estado: 'INCOMPLETA', duracion_segundos: 61 }),
    );
    await flush();
    expect(c.leer().resultado).toMatchObject({
      estado: 'INCOMPLETA',
      duracionSegundos: 61,
    });
  });

  it('si el último nodo no se puede pedir, igual se cierra como COMPLETADA', async () => {
    api.enviarRespuesta.mockResolvedValue(resultadoRespuesta(1, true));
    api.obtenerNodoActual.mockRejectedValue(SIN_CONEXION);
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.COMPLETADA,
    );
  });

  it('fallo al pedir el nodo (sin llegar al final): reintento y sin responder sobre el nodo viejo', async () => {
    api.obtenerNodoActual.mockRejectedValueOnce(SIN_CONEXION);
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();
    expect(c.leer().errorNodo).toBe(SIN_CONEXION);

    c.responder({ valor: null });
    expect(api.enviarRespuesta).toHaveBeenCalledTimes(1);

    c.reintentarNodo();
    await flush();
    expect(c.leer()).toMatchObject({ errorNodo: null, nodo: { idNodo: 'n2' } });
  });

  it('respuesta tardía: si el tiempo se agotó mientras viajaba, se descarta', async () => {
    const envio = diferido();
    api.enviarRespuesta.mockReturnValue(envio.promesa);
    const c = await enCurso();

    c.responder({ valor: null });
    reloj.avanzar(60_000);
    c.tick();
    envio.resolve(resultadoRespuesta(1));
    await flush();

    expect(api.obtenerNodoActual).not.toHaveBeenCalled();
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO,
    );
    expect(c.leer().fase).toBe(FASE_SOS.FINALIZADA);
    expect(c.leer().nodo.idNodo).toBe('n1');
  });

  it('409 TIEMPO_AGOTADO del backend: pide el cierre TIEMPO_AGOTADO', async () => {
    api.enviarRespuesta.mockRejectedValue(apiError(409, 'TIEMPO_AGOTADO'));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO,
    );
  });

  it('409 INTERVENCION_FINALIZADA: terminada con estado desconocido, sin otro cierre', async () => {
    api.enviarRespuesta.mockRejectedValue(
      apiError(409, 'INTERVENCION_FINALIZADA'),
    );
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(api.finalizarSos).not.toHaveBeenCalled();
    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.FINALIZADA,
      estadoDesconocido: true,
      resultado: null,
    });
  });

  it('400: error en línea; la siguiente respuesta es una interacción nueva', async () => {
    api.enviarRespuesta
      .mockRejectedValueOnce(apiError(400, 'VALOR_INVALIDO'))
      .mockResolvedValueOnce(resultadoRespuesta(1));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();
    expect(c.leer()).toMatchObject({
      accionErrorEnvio: ACCION_ERROR_ENVIO_SOS.INLINE,
      envio: null,
    });

    c.responder({ valor: null });
    await flush();
    const [[, a], [, b]] = api.enviarRespuesta.mock.calls;
    expect(b.id_interaccion).not.toBe(a.id_interaccion);
    expect(b.secuencia).toBe(1);
  });

  it('sin conexión: el reintento reenvía el mismo cuerpo (mismo id_interaccion)', async () => {
    api.enviarRespuesta
      .mockRejectedValueOnce(SIN_CONEXION)
      .mockResolvedValueOnce(resultadoRespuesta(1));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();
    expect(c.leer().accionErrorEnvio).toBe(ACCION_ERROR_ENVIO_SOS.REINTENTAR);

    c.reintentarEnvio();
    await flush();
    const [[, a], [, b]] = api.enviarRespuesta.mock.calls;
    expect(b).toBe(a);
    expect(c.leer().nodo.idNodo).toBe('n2');
  });

  it('otro conflicto (p. ej. NODO_DESACTUALIZADO) bloquea las respuestas; queda cerrar', async () => {
    api.enviarRespuesta.mockRejectedValue(apiError(409, 'NODO_DESACTUALIZADO'));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();
    c.responder({ valor: null });

    expect(api.enviarRespuesta).toHaveBeenCalledTimes(1);
    expect(c.leer().accionErrorEnvio).toBe(ACCION_ERROR_ENVIO_SOS.BLOQUEADO);
    c.cerrar();
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.CERRADA_POR_USUARIO,
    );
  });

  it('401 al responder: pide volver a iniciar sesión', async () => {
    api.enviarRespuesta.mockRejectedValue(apiError(401, 'DESCONOCIDO'));
    const c = await enCurso();

    c.responder({ valor: null });
    await flush();

    expect(c.leer().requiereLogin).toBe(true);
  });
});

describe('cierre (POST /chat/sos/:id/finalizar)', () => {
  it('cierre anticipado: CERRADA_POR_USUARIO una sola vez; estado y duración del servidor', async () => {
    const c = await enCurso();

    reloj.avanzar(15_000);
    c.cerrar();
    c.cerrar();
    await flush();

    expect(api.finalizarSos).toHaveBeenCalledTimes(1);
    expect(api.finalizarSos).toHaveBeenCalledWith(
      ID_INT,
      MOTIVO_FINALIZACION_SOS.CERRADA_POR_USUARIO,
    );
    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.FINALIZADA,
      motivo: MOTIVO_FINALIZACION_SOS.CERRADA_POR_USUARIO,
      resultado: {
        estado: 'INCOMPLETA',
        duracionSegundos: 15,
        sesionPausada: { idSesion: ID_PAUSADA, idNodoActual: 'nodo-pausado' },
      },
    });
    expect(c.enCurso()).toBe(false);
  });

  it.each(['INTERVENCION_FINALIZADA', 'INTERVENCION_NO_ENCONTRADA'])(
    '%s: no se inventa un resultado',
    async (codigo) => {
      api.finalizarSos.mockRejectedValue(
        apiError(codigo === 'INTERVENCION_FINALIZADA' ? 409 : 404, codigo),
      );
      const c = await enCurso();

      c.cerrar();
      await flush();

      expect(c.leer()).toMatchObject({
        fase: FASE_SOS.FINALIZADA,
        estadoDesconocido: true,
        resultado: null,
        error: { codigo },
      });
    },
  );

  it('sin conexión: error de cierre y reintento con el mismo motivo', async () => {
    api.finalizarSos.mockRejectedValueOnce(SIN_CONEXION);
    const c = await enCurso();

    reloj.avanzar(60_000);
    c.tick();
    await flush();
    expect(c.leer().fase).toBe(FASE_SOS.ERROR_FINALIZACION);
    expect(c.enCurso()).toBe(true);

    c.reintentarFinalizacion();
    await flush();
    expect(api.finalizarSos).toHaveBeenCalledTimes(2);
    expect(api.finalizarSos.mock.calls[1]).toEqual([
      ID_INT,
      MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO,
    ]);
    expect(c.leer().fase).toBe(FASE_SOS.FINALIZADA);
  });

  it('401 al cerrar: pide volver a iniciar sesión', async () => {
    api.finalizarSos.mockRejectedValue(apiError(401, 'DESCONOCIDO'));
    const c = await enCurso();

    c.cerrar();
    await flush();

    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.ERROR_FINALIZACION,
      requiereLogin: true,
    });
  });

  it('respuesta de cierre sin estado: estado desconocido', async () => {
    api.finalizarSos.mockResolvedValue({});
    const c = await enCurso();

    c.cerrar();
    await flush();

    expect(c.leer()).toMatchObject({
      fase: FASE_SOS.FINALIZADA,
      estadoDesconocido: true,
    });
  });
});

describe('medición y descarte', () => {
  it('mide toque → nodo y toque → interfaz (una vez)', async () => {
    const c = crearControladorSos({ api, reloj, toque: reloj.mono() });

    reloj.avanzar(40);
    c.marcarInterfaz();
    reloj.avanzar(200);
    await c.activar();
    reloj.avanzar(500);
    c.marcarInterfaz();

    expect(c.leer().medicion).toEqual({ interfazMs: 40, nodoMs: 240 });
  });

  it('una vez descartado no aplica lo que llegue después', async () => {
    const respuesta = diferido();
    api.activarSos.mockReturnValue(respuesta.promesa);
    const c = crearControladorSos({ api, reloj });
    const oyente = vi.fn();
    c.suscribir(oyente);

    const activando = c.activar();
    c.descartar();
    respuesta.resolve(activacion());
    await activando;

    expect(c.leer().fase).toBe(FASE_SOS.ACTIVANDO);
    expect(oyente).not.toHaveBeenCalled();
    expect(c.enCurso()).toBe(false);
  });
});
