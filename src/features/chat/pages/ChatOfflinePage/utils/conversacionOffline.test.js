import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prepararSesionDemoOffline } from '../../../demo/prepararDemoOffline.js';
import { PAQUETE_DEMO_OFFLINE } from '../../../demo/paqueteDemoOffline.js';
import { decidirRespuestaOffline } from '../../../services/offline/motorOffline.js';
import { cerrarBrisaChatDb } from '../../../storage/brisaChatDb.js';
import {
  USUARIO_A,
  USUARIO_B,
  reiniciarIndexedDb,
} from '../../../storage/entornoPruebas.js';
import {
  actualizarSesionLocal,
  guardarPaquete,
  guardarSesionLocal,
  listarColaSesion,
  obtenerSesionLocal,
} from '../../../storage/index.js';

import {
  BloqueoOffline,
  cargarConversacionOffline,
  guardarRespuestaOffline,
} from './conversacionOffline.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

// Responde el nodo actual como lo haría la página: decide y guarda.
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
  return decision;
}

const bloqueo = (codigo) =>
  expect.objectContaining({ name: 'BloqueoOffline', codigo });

describe('carga de la conversación guardada', () => {
  it('abre en el nodo inicial con los recursos que faltan en el dispositivo', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);
    const datos = await cargarConversacionOffline(idSesion, USUARIO_A);

    expect(datos.actual.nodo.idNodo).toBe('demo-nodo-bienvenida');
    // El guardado sí está; solo falta el ausente.
    expect(datos.actual.recursosNoPresentados).toEqual([
      'demo-recurso-ausente',
    ]);
    expect(datos).toMatchObject({ pendientes: 0, completada: false });
  });

  it('aislamiento: otro usuario no abre la sesión ni el paquete', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);

    await expect(
      cargarConversacionOffline(idSesion, USUARIO_B),
    ).rejects.toEqual(bloqueo('SIN_PAQUETE'));
  });

  it('sin sesión local o sin paquete: SIN_PAQUETE', async () => {
    const idSesion = '33333333-3333-4333-8333-333333333333';

    await expect(
      cargarConversacionOffline(idSesion, USUARIO_A),
    ).rejects.toEqual(bloqueo('SIN_PAQUETE'));

    await guardarSesionLocal({
      id_sesion: idSesion,
      id_usuario: USUARIO_A,
      id_nodo_actual: 'demo-nodo-escala',
      ultima_secuencia: 0,
      estado_sesion_offline: 'EN_CURSO',
    });
    await expect(
      cargarConversacionOffline(idSesion, USUARIO_A),
    ).rejects.toEqual(bloqueo('SIN_PAQUETE'));
  });

  it('nodo guardado que no está en el paquete: NODO_AUSENTE', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);
    await actualizarSesionLocal(idSesion, USUARIO_A, {
      id_nodo_actual: 'nodo-que-no-esta',
    });

    await expect(
      cargarConversacionOffline(idSesion, USUARIO_A),
    ).rejects.toEqual(bloqueo('NODO_AUSENTE'));
  });

  it('sin IndexedDB: bloqueo ALMACENAMIENTO_NO_DISPONIBLE', async () => {
    await cerrarBrisaChatDb();
    globalThis.indexedDB = undefined;

    await expect(cargarConversacionOffline('x', USUARIO_A)).rejects.toEqual(
      bloqueo('ALMACENAMIENTO_NO_DISPONIBLE'),
    );
  });
});

describe('responder y retomar', () => {
  it('encola cada respuesta con su secuencia y retoma desde el último nodo guardado', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);

    await responder(idSesion, USUARIO_A, null);
    await responder(idSesion, USUARIO_A, 3);

    // Reapertura: lo guardado manda, no la memoria de la página.
    const retomada = await cargarConversacionOffline(idSesion, USUARIO_A);
    expect(retomada.actual.nodo.idNodo).toBe('demo-nodo-respiracion');
    expect(retomada.pendientes).toBe(2);

    const cola = await listarColaSesion(idSesion, USUARIO_A);
    expect(
      cola.map((i) => [i.secuencia, i.id_nodo, i.tipo_entrada, i.valor]),
    ).toEqual([
      [1, 'demo-nodo-bienvenida', 'CONTINUAR', null],
      [2, 'demo-nodo-escala', 'ESCALA', 3],
    ]);
    // Solo el recurso referenciado y ausente queda como no presentado.
    expect(cola[0].recursos_no_presentados).toEqual(['demo-recurso-ausente']);
    expect(cola[1]).toMatchObject({
      estado_conectividad: 'SIN_CONEXION',
      estado_sincronizacion: 'PENDIENTE_SINCRONIZACION',
    });
  });

  it('llegar al nodo terminal completa la sesión local', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);

    for (const valor of [null, 2, null, 4])
      await responder(idSesion, USUARIO_A, valor);

    expect(await obtenerSesionLocal(idSesion, USUARIO_A)).toMatchObject({
      id_nodo_actual: 'demo-nodo-cierre',
      estado_sesion_offline: 'COMPLETADA',
      ultima_secuencia: 4,
    });
    expect(await cargarConversacionOffline(idSesion, USUARIO_A)).toMatchObject({
      completada: true,
      pendientes: 4,
    });
  });

  it('secuencia desconocida: bloqueo y nada se guarda', async () => {
    const idSesion = '44444444-4444-4444-8444-444444444444';
    await guardarPaquete({
      ...PAQUETE_DEMO_OFFLINE,
      id_sesion: idSesion,
      id_usuario: USUARIO_A,
    });
    await guardarSesionLocal({
      id_sesion: idSesion,
      id_usuario: USUARIO_A,
      id_nodo_actual: 'demo-nodo-escala',
      ultima_secuencia: null,
      estado_sesion_offline: 'EN_CURSO',
    });

    await expect(responder(idSesion, USUARIO_A, 3)).rejects.toEqual(
      bloqueo('SECUENCIA_NO_DETERMINADA'),
    );
    expect(await listarColaSesion(idSesion, USUARIO_A)).toEqual([]);
    expect((await obtenerSesionLocal(idSesion, USUARIO_A)).id_nodo_actual).toBe(
      'demo-nodo-escala',
    );
  });

  it('fallo de escritura: la promesa se rechaza y el nodo no avanza', async () => {
    const idSesion = await prepararSesionDemoOffline(USUARIO_A);
    const { paquete, actual } = await cargarConversacionOffline(
      idSesion,
      USUARIO_A,
    );
    const decision = decidirRespuestaOffline(paquete, actual.nodo.idNodo, null);

    // id_nodo vacío: la base rechaza la interacción (DATOS_INVALIDOS).
    const error = await guardarRespuestaOffline({
      idSesion,
      idUsuario: USUARIO_A,
      idNodo: '',
      decision,
      recursosNoPresentados: [],
      conectividad: 'SIN_CONEXION',
    }).catch((e) => e);

    expect(error).not.toBeInstanceOf(BloqueoOffline);
    expect(error.code).toBe('DATOS_INVALIDOS');
    expect((await obtenerSesionLocal(idSesion, USUARIO_A)).id_nodo_actual).toBe(
      'demo-nodo-bienvenida',
    );
  });
});
