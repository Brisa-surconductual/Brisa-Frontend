import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createChatApiError } from '../../api/chatApiUtils.js';
import { prepararSesionDemoOffline } from '../../demo/prepararDemoOffline.js';
import {
  ESCENARIO_SIMULADOR,
  obtenerSimulador,
} from '../../demo/simuladorSincronizacion.js';
import {
  cargarConversacionOffline,
  guardarRespuestaOffline,
} from '../../pages/ChatOfflinePage/utils/conversacionOffline.js';
import { cerrarBrisaChatDb } from '../../storage/brisaChatDb.js';
import {
  USUARIO_A,
  USUARIO_B,
  reiniciarIndexedDb,
} from '../../storage/entornoPruebas.js';
import {
  aplicarResultadoLote,
  listarColaSesion,
  obtenerSesionLocal,
} from '../../storage/index.js';
import { decidirRespuestaOffline } from '../offline/motorOffline.js';

import { sincronizarSesion } from './sincronizarSesion.js';

/*
 * Integración de la tarea 4 con la cola real de E3-B (fake-indexeddb) y
 * el simulador de la demostración, sin latencia. Datos ficticios.
 */
const simulador = obtenerSimulador();

beforeEach(async () => {
  await reiniciarIndexedDb();
  simulador.reiniciar();
  simulador.configurar({ latenciaMs: 0, conexionDisponible: () => true });
});
afterEach(cerrarBrisaChatDb);

// Responde como la pantalla sin conexión: decide y encola.
async function responder(idSesion, idUsuario, valor) {
  const { paquete, actual } = await cargarConversacionOffline(
    idSesion,
    idUsuario,
  );
  const decision = decidirRespuestaOffline(paquete, actual.nodo.idNodo, valor);

  await guardarRespuestaOffline({
    idSesion,
    idUsuario,
    idNodo: actual.nodo.idNodo,
    decision,
    recursosNoPresentados: actual.recursosNoPresentados,
    conectividad: 'SIN_CONEXION',
  });
}

// Demo completa: bienvenida, escala 2, respiración, número 4 → cierre.
async function sesionConCuatro(idUsuario = USUARIO_A) {
  const idSesion = await prepararSesionDemoOffline(idUsuario);
  for (const valor of [null, 2, null, 4])
    await responder(idSesion, idUsuario, valor);
  return idSesion;
}

const sincronizar = (idSesion, extra = {}) =>
  sincronizarSesion({
    idSesion,
    idUsuario: USUARIO_A,
    transporte: simulador.crearTransporte(USUARIO_A),
    ...extra,
  });

const cola = (idSesion, idUsuario = USUARIO_A) =>
  listarColaSesion(idSesion, idUsuario);
const solicitudes = () => simulador.estadisticas().solicitudes;

describe('resultados por interacción', () => {
  it('éxito: borra todo, queda al día y el nodo del servidor coincide', async () => {
    const idSesion = await sesionConCuatro();

    const r = await sincronizar(idSesion);

    expect(r).toMatchObject({
      estado: 'AL_DIA',
      pendientes: 0,
      reintentar: false,
    });
    expect(r.reconciliacion).toMatchObject({
      idNodoServidor: 'demo-nodo-cierre',
      idNodoLocal: 'demo-nodo-cierre',
      coincide: true,
      estadoSesionServidor: 'COMPLETADA',
    });
    expect(await cola(idSesion)).toEqual([]);
  });

  it('DUPLICADA también se borra', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.DUPLICADA);

    expect((await sincronizar(idSesion)).estado).toBe('AL_DIA');
    expect(await cola(idSesion)).toEqual([]);
  });

  it('RECHAZADA: borra la anterior, marca el error, conserva las siguientes y no reintenta', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.RECHAZO);

    const r = await sincronizar(idSesion);

    expect(r).toMatchObject({
      estado: 'PENDIENTE_DE_RESOLUCION',
      reintentar: false,
      pendientes: 2,
      conError: 1,
      error: {
        codigo: 'FUERA_DE_RANGO',
        mensaje: 'El valor ingresado está fuera del rango permitido.',
      },
    });
    expect(
      (await cola(idSesion)).map((i) => [
        i.secuencia,
        i.estado_sincronizacion,
        i.intentos,
      ]),
    ).toEqual([
      [2, 'ERROR_SINCRONIZACION', 1],
      [3, 'PENDIENTE_SINCRONIZACION', 1],
      [4, 'PENDIENTE_SINCRONIZACION', 1],
    ]);

    // Otro intento no envía nada: la sesión queda detenida.
    const enviadas = solicitudes();
    expect((await sincronizar(idSesion)).estado).toBe(
      'PENDIENTE_DE_RESOLUCION',
    );
    expect(solicitudes()).toBe(enviadas);
  });

  it('PENDIENTE: no se trata como confirmada y se reintenta después', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.PENDIENTE);

    expect(await sincronizar(idSesion)).toMatchObject({
      estado: 'REINTENTO_PROGRAMADO',
      reintentar: true,
      pendientes: 3,
    });
    expect((await cola(idSesion)).map((i) => i.secuencia)).toEqual([2, 3, 4]);

    expect((await sincronizar(idSesion)).estado).toBe('AL_DIA');
  });

  it('respuesta 200 incoherente: no se borra nada', async () => {
    const idSesion = await sesionConCuatro();
    const transporte = {
      sincronizar: async (_id, { interacciones }) => ({
        data: {
          resultados: [
            {
              id_interaccion: interacciones[0].id_interaccion,
              secuencia: 99,
              resultado: 'SINCRONIZADA',
            },
          ],
        },
      }),
    };

    expect(await sincronizar(idSesion, { transporte })).toMatchObject({
      estado: 'RESPUESTA_NO_VERIFICABLE',
      reintentar: false,
    });
    expect(await cola(idSesion)).toHaveLength(4);
  });

  it('un id_nodo_actual distinto se informa y no sobrescribe el avance local', async () => {
    const idSesion = await sesionConCuatro();
    const transporte = {
      sincronizar: async (_id, { interacciones }) => ({
        data: {
          resultados: interacciones.map((i) => ({
            ...i,
            resultado: 'SINCRONIZADA',
            codigo: null,
            mensaje: null,
          })),
          id_nodo_actual: 'demo-nodo-escala',
          estado_sesion: 'ACTIVA',
        },
      }),
    };

    const r = await sincronizar(idSesion, { transporte });

    expect(r.reconciliacion).toMatchObject({
      coincide: false,
      idNodoServidor: 'demo-nodo-escala',
    });
    expect((await obtenerSesionLocal(idSesion, USUARIO_A)).id_nodo_actual).toBe(
      'demo-nodo-cierre',
    );
  });

  it('más pendientes que el tamaño del lote: varios lotes en orden', async () => {
    const idSesion = await sesionConCuatro();

    const r = await sincronizar(idSesion, { config: { tamanoMaximoLote: 3 } });

    expect(r.estado).toBe('AL_DIA');
    expect(solicitudes()).toBe(2);
  });
});

describe('fallos del envío: la cola se conserva', () => {
  it('sin respuesta: interrumpida; el reintento recibe DUPLICADA y vacía la cola', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.INTERRUPCION);

    expect(await sincronizar(idSesion)).toMatchObject({
      estado: 'INTERRUMPIDA',
      reintentar: true,
      falloDeRed: true,
      respondio: false,
    });
    const intacta = await cola(idSesion);
    expect(intacta.map((i) => [i.secuencia, i.estado_sincronizacion])).toEqual([
      [1, 'PENDIENTE_SINCRONIZACION'],
      [2, 'PENDIENTE_SINCRONIZACION'],
      [3, 'PENDIENTE_SINCRONIZACION'],
      [4, 'PENDIENTE_SINCRONIZACION'],
    ]);
    expect(intacta[0].ultimo_error).toEqual({
      codigo: 'SIN_CONEXION',
      mensaje: null,
    });

    // Mismos id_interaccion en el reintento: el servidor los reconoce.
    expect((await sincronizar(idSesion)).estado).toBe('AL_DIA');
    expect(await cola(idSesion)).toEqual([]);
  });

  it('motor detenido a mitad del envío: no se registra nada', async () => {
    const idSesion = await sesionConCuatro();
    const controlador = new AbortController();
    simulador.configurar({ latenciaMs: 50 });

    const promesa = sincronizar(idSesion, { senal: controlador.signal });
    controlador.abort();

    expect((await promesa).estado).toBe('INTERRUMPIDA');
    expect((await cola(idSesion)).every((i) => i.intentos === 0)).toBe(true);
  });

  it.each([
    [
      ESCENARIO_SIMULADOR.ERROR_SERVIDOR,
      'REINTENTO_PROGRAMADO',
      true,
      'ERROR_SINCRONIZACION',
    ],
    [
      ESCENARIO_SIMULADOR.NO_AUTENTICADO,
      'ESPERANDO_AUTENTICACION',
      false,
      'NO_AUTENTICADO',
    ],
    [
      ESCENARIO_SIMULADOR.LOTE_INVALIDO,
      'LOTE_INVALIDO',
      false,
      'LOTE_INVALIDO',
    ],
  ])(
    '%s → %s, sin perder interacciones',
    async (escenario, estado, reintentar, codigo) => {
      const idSesion = await sesionConCuatro();
      simulador.elegirEscenario(escenario);

      expect(await sincronizar(idSesion)).toMatchObject({ estado, reintentar });
      const intacta = await cola(idSesion);
      expect(intacta).toHaveLength(4);
      expect(
        intacta.every(
          (i) => i.estado_sincronizacion === 'PENDIENTE_SINCRONIZACION',
        ),
      ).toBe(true);
      expect(intacta[0].ultimo_error.codigo).toBe(codigo);
    },
  );

  it('403 CSRF_INVALIDO: renueva el token, reintenta una vez y sincroniza', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.CSRF_INVALIDO);

    expect((await sincronizar(idSesion)).estado).toBe('AL_DIA');
    expect(solicitudes()).toBe(2);
  });

  it('403 dos veces: no renueva sin fin, pasa a backoff', async () => {
    const idSesion = await sesionConCuatro();
    let renovaciones = 0;
    const transporte = {
      sincronizar: async () => {
        throw createChatApiError({ code: 'CSRF_INVALIDO', status: 403 });
      },
      renovarCsrf: async () => {
        renovaciones += 1;
      },
    };

    expect(await sincronizar(idSesion, { transporte })).toMatchObject({
      estado: 'REINTENTO_PROGRAMADO',
      reintentar: true,
    });
    expect(renovaciones).toBe(1);
  });

  it('404 SESION_NO_ENCONTRADA: marca el lote como error', async () => {
    const idSesion = await sesionConCuatro();
    simulador.elegirEscenario(ESCENARIO_SIMULADOR.SESION_NO_ENCONTRADA);

    expect(await sincronizar(idSesion)).toMatchObject({
      estado: 'PENDIENTE_DE_RESOLUCION',
      reintentar: false,
    });
    expect(
      (await cola(idSesion)).every(
        (i) => i.estado_sincronizacion === 'ERROR_SINCRONIZACION',
      ),
    ).toBe(true);
  });
});

describe('aislamiento por usuario', () => {
  it('sincronizar a un usuario no toca la cola de otro', async () => {
    const deA = await sesionConCuatro(USUARIO_A);
    const deB = await sesionConCuatro(USUARIO_B);

    await sincronizar(deA);

    expect(await cola(deA)).toEqual([]);
    expect(await cola(deB, USUARIO_B)).toHaveLength(4);
    // Con la sesión de otro, el usuario no tiene nada que enviar.
    expect(await sincronizar(deB)).toMatchObject({
      estado: 'AL_DIA',
      pendientes: 0,
    });
    expect(await cola(deB, USUARIO_B)).toHaveLength(4);
  });

  it('el servidor simulado no reconoce la sesión de otro usuario (404)', async () => {
    const deA = await sesionConCuatro(USUARIO_A);
    const [primera] = await cola(deA);

    await expect(
      simulador.crearTransporte(USUARIO_B).sincronizar(deA, {
        interacciones: [{ ...primera }],
      }),
    ).rejects.toMatchObject({ code: 'SESION_NO_ENCONTRADA' });
  });

  it('aplicarResultadoLote no borra nada si una interacción es de otro usuario', async () => {
    const deA = await sesionConCuatro(USUARIO_A);
    const ids = (await cola(deA)).map((i) => i.id_interaccion);

    await expect(
      aplicarResultadoLote(USUARIO_B, deA, { confirmadas: ids }),
    ).rejects.toMatchObject({
      code: 'USUARIO_NO_CORRESPONDE',
    });
    expect(await cola(deA)).toHaveLength(4);
  });
});
