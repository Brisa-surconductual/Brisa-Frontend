import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CODIGO_ERROR_CLIENTE as C,
  registrarErrorCliente,
  reiniciarErroresCliente,
  reintentarReportePendiente,
} from './erroresCliente.js';

const ID = '37000000-0000-4000-8000-000000000001';
const OTRA = '37000000-0000-4000-8000-000000000002';

const sinRed = () => Object.assign(new Error('x'), { status: null });

describe('registrarErrorCliente (RF-37)', () => {
  beforeEach(() => reiniciarErroresCliente());

  it('envía solo codigo e id_sesion, nunca datos del error', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);

    await expect(
      registrarErrorCliente(
        {
          codigo: C.ERROR_PRESENTACION,
          idSesion: ID,
          stack: 'at Foo (src/x.js:1)',
          mensaje: 'secreto',
          valor: 'respuesta clínica',
        },
        { enviar, ahora: 0 },
      ),
    ).resolves.toBe(true);

    expect(enviar).toHaveBeenCalledWith({
      codigo: C.ERROR_PRESENTACION,
      idSesion: ID,
    });
    expect(JSON.stringify(enviar.mock.calls)).not.toMatch(
      /stack|secreto|clínica/,
    );
  });

  it('descarta códigos fuera del contrato y un id_sesion que no es UUID', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);

    await expect(
      registrarErrorCliente({ codigo: 'ERROR_HTTP' }, { enviar, ahora: 0 }),
    ).resolves.toBe(false);
    await registrarErrorCliente(
      { codigo: C.SIN_CONEXION, idSesion: '../x' },
      { enviar, ahora: 0 },
    );

    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar).toHaveBeenCalledWith({
      codigo: C.SIN_CONEXION,
      idSesion: null,
    });
  });

  it('un mismo código por sesión se reporta una vez por minuto', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    const reporte = { codigo: C.RECURSO_NO_DISPONIBLE, idSesion: ID };

    await registrarErrorCliente(reporte, { enviar, ahora: 0 });
    await registrarErrorCliente(reporte, { enviar, ahora: 1000 });
    await registrarErrorCliente(
      { ...reporte, idSesion: OTRA },
      { enviar, ahora: 1000 },
    );
    await registrarErrorCliente(reporte, { enviar, ahora: 61_000 });

    expect(enviar).toHaveBeenCalledTimes(3);
  });

  it('se limita por debajo de la cuota del backend', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    const sesiones = Array.from(
      { length: 8 },
      (_, i) => `37000000-0000-4000-8000-00000000001${i}`,
    );

    for (const idSesion of sesiones) {
      await registrarErrorCliente(
        { codigo: C.ERROR_PRESENTACION, idSesion },
        { enviar, ahora: 0 },
      );
    }

    expect(enviar).toHaveBeenCalledTimes(5);
  });

  it('tras un 429 hace una pausa', async () => {
    const enviar = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('x'), { status: 429 }))
      .mockResolvedValue(undefined);

    await registrarErrorCliente(
      { codigo: C.ERROR_PRESENTACION, idSesion: ID },
      { enviar, ahora: 0 },
    );
    await expect(
      registrarErrorCliente(
        { codigo: C.SIN_CONEXION, idSesion: ID },
        { enviar, ahora: 10_000 },
      ),
    ).resolves.toBe(false);

    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('si el propio reporte falla, no lanza ni se reporta a sí mismo', async () => {
    const enviar = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('x'), { status: 500 }));

    await expect(
      registrarErrorCliente(
        { codigo: C.ERROR_PRESENTACION, idSesion: ID },
        { enviar, ahora: 0 },
      ),
    ).resolves.toBe(false);

    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('sin red guarda un SIN_CONEXION pendiente y lo intenta una vez al volver', async () => {
    const enviar = vi
      .fn()
      .mockRejectedValueOnce(sinRed())
      .mockResolvedValue(undefined);

    await expect(
      registrarErrorCliente(
        { codigo: C.SIN_CONEXION, idSesion: ID },
        { enviar, ahora: 0 },
      ),
    ).resolves.toBe(false);

    await expect(
      reintentarReportePendiente({ enviar, ahora: 5000 }),
    ).resolves.toBe(true);
    await expect(
      reintentarReportePendiente({ enviar, ahora: 6000 }),
    ).resolves.toBe(false);

    expect(enviar).toHaveBeenCalledTimes(2);
    expect(enviar).toHaveBeenLastCalledWith({
      codigo: C.SIN_CONEXION,
      idSesion: ID,
    });
  });

  it('otros códigos sin red no quedan pendientes (no hay garantía de entrega)', async () => {
    const enviar = vi.fn().mockRejectedValue(sinRed());

    await registrarErrorCliente(
      { codigo: C.ERROR_PRESENTACION, idSesion: ID },
      { enviar, ahora: 0 },
    );

    await expect(reintentarReportePendiente({ enviar })).resolves.toBe(false);
    expect(enviar).toHaveBeenCalledTimes(1);
  });
});
